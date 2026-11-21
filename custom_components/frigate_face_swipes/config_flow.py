"""Config flow for Frigate Face Swipes."""

from __future__ import annotations

import logging
from typing import Any

import aiohttp
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.helpers.aiohttp_client import async_get_clientsession

from .const import (
    CONF_FRIGATE_URL,
    CONF_PASSWORD,
    CONF_SHOW_SIDEBAR,
    CONF_USERNAME,
    CONF_VERIFY_SSL,
    DEFAULT_FRIGATE_URL,
    DOMAIN,
)

_LOGGER = logging.getLogger(__name__)


async def _validate_frigate(
    hass: Any,
    frigate_url: str,
    username: str,
    password: str,
    verify_ssl: bool,
) -> None:
    base = frigate_url.strip().rstrip("/")
    session = async_get_clientsession(hass, verify_ssl=verify_ssl)
    cookies: dict[str, str] = {}

    if username and password:
        async with session.post(
            f"{base}/api/login",
            json={"user": username, "password": password},
            timeout=aiohttp.ClientTimeout(total=10),
        ) as resp:
            if resp.status in (401, 403):
                raise ValueError("invalid_auth")
            if resp.status >= 400:
                raise ConnectionError(f"HTTP {resp.status}")
            for name, morsel in resp.cookies.items():
                cookies[name] = morsel.value

    async with session.get(
        f"{base}/api/version",
        cookies=cookies or None,
        timeout=aiohttp.ClientTimeout(total=10),
    ) as resp:
        if resp.status in (401, 403):
            raise ValueError("invalid_auth")
        if resp.status >= 400:
            raise ConnectionError(f"HTTP {resp.status}")


class FrigateFaceSwipesConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Frigate Face Swipes."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> config_entries.ConfigFlowResult:
        errors: dict[str, str] = {}

        # Try to prefill from an existing Frigate integration entry
        suggested_url = DEFAULT_FRIGATE_URL
        suggested_user = ""
        suggested_pass = ""
        for entry in self.hass.config_entries.async_entries("frigate"):
            if entry.data.get("url"):
                suggested_url = entry.data["url"]
            if entry.data.get("username"):
                suggested_user = entry.data["username"]
            if entry.data.get("password"):
                suggested_pass = entry.data["password"]
            break

        if user_input is not None:
            frigate_url = user_input[CONF_FRIGATE_URL].strip().rstrip("/")
            username = user_input.get(CONF_USERNAME, "").strip()
            password = user_input.get(CONF_PASSWORD, "")
            verify_ssl = bool(user_input.get(CONF_VERIFY_SSL, False))

            await self.async_set_unique_id(frigate_url)
            self._abort_if_unique_id_configured()

            try:
                await _validate_frigate(
                    self.hass, frigate_url, username, password, verify_ssl
                )
            except ValueError:
                errors["base"] = "invalid_auth"
            except Exception as err:  # noqa: BLE001
                _LOGGER.warning("Failed to connect to Frigate at %s: %s", frigate_url, err)
                errors["base"] = "cannot_connect"
            else:
                return self.async_create_entry(
                    title=f"Frigate Face Swipes ({frigate_url})",
                    data={
                        CONF_FRIGATE_URL: frigate_url,
                        CONF_USERNAME: username,
                        CONF_PASSWORD: password,
                        CONF_VERIFY_SSL: verify_ssl,
                        CONF_SHOW_SIDEBAR: bool(user_input.get(CONF_SHOW_SIDEBAR, True)),
                    },
                )

        schema = vol.Schema(
            {
                vol.Required(CONF_FRIGATE_URL, default=suggested_url): str,
                vol.Optional(CONF_USERNAME, default=suggested_user): str,
                vol.Optional(CONF_PASSWORD, default=suggested_pass): str,
                vol.Optional(CONF_VERIFY_SSL, default=False): bool,
                vol.Optional(CONF_SHOW_SIDEBAR, default=True): bool,
            }
        )
        return self.async_show_form(step_id="user", data_schema=schema, errors=errors)
