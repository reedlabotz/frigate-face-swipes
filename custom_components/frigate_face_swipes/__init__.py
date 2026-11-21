"""The Frigate Face Swipes integration."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import aiohttp
from aiohttp import web
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import HomeAssistantView
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    CONF_FRIGATE_URL,
    CONF_PASSWORD,
    CONF_SHOW_SIDEBAR,
    CONF_USERNAME,
    CONF_VERIFY_SSL,
    DOMAIN,
    FRONTEND_SCRIPT_URL,
)

_LOGGER = logging.getLogger(__name__)

ALLOWED_PREFIXES = (
    "api/faces",
    "api/events",
    "api/config",
    "api/version",
    "clips/faces",
)


class FrigateProxyClient:
    """Async HTTP client for proxying Frigate face recognition requests."""

    def __init__(
        self,
        hass: HomeAssistant,
        base_url: str,
        username: str = "",
        password: str = "",
        verify_ssl: bool = False,
    ) -> None:
        self.hass = hass
        self.base_url = base_url.strip().rstrip("/")
        self.username = username
        self.password = password
        self.verify_ssl = verify_ssl
        self._cookies: dict[str, str] = {}

    async def _login(self) -> None:
        if not (self.username and self.password):
            return
        session = async_get_clientsession(self.hass, verify_ssl=self.verify_ssl)
        async with session.post(
            f"{self.base_url}/api/login",
            json={"user": self.username, "password": self.password},
            timeout=aiohttp.ClientTimeout(total=15),
        ) as resp:
            if resp.status < 400:
                self._cookies = {k: v.value for k, v in resp.cookies.items()}

    async def forward(
        self,
        method: str,
        path: str,
        query: str = "",
        body: bytes | None = None,
        content_type: str | None = None,
    ) -> tuple[int, bytes, str]:
        """Forward an HTTP request to Frigate and return (status, body, content_type)."""
        session = async_get_clientsession(self.hass, verify_ssl=self.verify_ssl)
        url = f"{self.base_url}/{path.lstrip('/')}"
        if query:
            url = f"{url}?{query}"

        headers: dict[str, str] = {}
        if content_type:
            headers["Content-Type"] = content_type

        if self.username and self.password and not self._cookies:
            await self._login()

        for attempt in range(2):
            async with session.request(
                method,
                url,
                data=body if body else None,
                headers=headers or None,
                cookies=self._cookies or None,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as resp:
                if resp.status == 401 and attempt == 0 and self.username and self.password:
                    await self._login()
                    continue
                payload = await resp.read()
                resp_ct = resp.headers.get("Content-Type", "application/octet-stream")
                return resp.status, payload, resp_ct

        return 502, b'{"error":"Frigate request failed"}', "application/json"


class FrigateFaceSwipesProxyView(HomeAssistantView):
    """Authenticated Home Assistant HTTP proxy to Frigate face APIs."""

    url = "/api/frigate_face_swipes/proxy/{entry_id}/{path:.*}"
    name = "api:frigate_face_swipes:proxy"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    def _get_client(self, entry_id: str) -> FrigateProxyClient | None:
        clients: dict[str, FrigateProxyClient] = self.hass.data.get(DOMAIN, {}).get(
            "clients", {}
        )
        if entry_id == "default":
            return next(iter(clients.values()), None)
        return clients.get(entry_id)

    async def _handle(
        self, request: web.Request, entry_id: str, path: str
    ) -> web.Response:
        clean_path = path.lstrip("/")
        if not any(clean_path.startswith(prefix) for prefix in ALLOWED_PREFIXES):
            return web.json_response(
                {"error": f"Path '{clean_path}' is not permitted"}, status=403
            )

        client = self._get_client(entry_id)
        if client is None:
            return web.json_response(
                {"error": "Frigate Face Swipes is not configured"}, status=404
            )

        body = await request.read() if request.can_read_body else None
        content_type = request.headers.get("Content-Type")
        try:
            status, resp_body, resp_ct = await client.forward(
                request.method,
                clean_path,
                query=request.query_string,
                body=body,
                content_type=content_type,
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.error("Frigate proxy error for %s: %s", clean_path, err)
            return web.json_response({"error": str(err)}, status=502)

        return web.Response(
            status=status,
            body=resp_body,
            content_type=resp_ct.split(";")[0],
        )

    async def get(self, request: web.Request, entry_id: str, path: str) -> web.Response:
        return await self._handle(request, entry_id, path)

    async def post(self, request: web.Request, entry_id: str, path: str) -> web.Response:
        return await self._handle(request, entry_id, path)

    async def put(self, request: web.Request, entry_id: str, path: str) -> web.Response:
        return await self._handle(request, entry_id, path)

    async def delete(
        self, request: web.Request, entry_id: str, path: str
    ) -> web.Response:
        return await self._handle(request, entry_id, path)


async def _register_frontend(hass: HomeAssistant, show_sidebar: bool) -> None:
    domain_data = hass.data.setdefault(DOMAIN, {})
    if domain_data.get("frontend_registered"):
        return

    frontend_dir = Path(__file__).parent / "frontend"
    try:
        from homeassistant.components.http import StaticPathConfig

        await hass.http.async_register_static_paths(
            [StaticPathConfig("/frigate_face_swipes", str(frontend_dir), False)]
        )
    except ImportError:
        hass.http.register_static_path(
            "/frigate_face_swipes", str(frontend_dir), cache_headers=False
        )

    add_extra_js_url(hass, FRONTEND_SCRIPT_URL)

    if show_sidebar:
        try:
            from homeassistant.components import panel_custom

            await panel_custom.async_register_panel(
                hass,
                webcomponent_name="frigate-face-swipes-panel",
                frontend_url_path="frigate-face-swipes",
                sidebar_title="Face Swipes",
                sidebar_icon="mdi:face-recognition",
                module_url=FRONTEND_SCRIPT_URL,
                require_admin=False,
            )
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("Could not register sidebar panel: %s", err)

    domain_data["frontend_registered"] = True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Frigate Face Swipes from a config entry."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    clients: dict[str, FrigateProxyClient] = domain_data.setdefault("clients", {})

    clients[entry.entry_id] = FrigateProxyClient(
        hass,
        base_url=entry.data[CONF_FRIGATE_URL],
        username=entry.data.get(CONF_USERNAME, ""),
        password=entry.data.get(CONF_PASSWORD, ""),
        verify_ssl=bool(entry.data.get(CONF_VERIFY_SSL, False)),
    )

    if not domain_data.get("view_registered"):
        hass.http.register_view(FrigateFaceSwipesProxyView(hass))
        domain_data["view_registered"] = True

    await _register_frontend(
        hass, show_sidebar=bool(entry.data.get(CONF_SHOW_SIDEBAR, True))
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    clients: dict[str, Any] = hass.data.get(DOMAIN, {}).get("clients", {})
    clients.pop(entry.entry_id, None)
    return True
