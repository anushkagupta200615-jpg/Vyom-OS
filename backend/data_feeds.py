import httpx
import asyncio
from datetime import datetime, timedelta

GOES_1DAY = "https://services.swpc.noaa.gov/json/goes/primary/xrays-1-day.json"
FLARE_EVENTS = "https://services.swpc.noaa.gov/json/goes/primary/xray-flares-7-day.json"

def classify_flare(flux: float) -> str:
    if flux < 1e-7: return "A"
    elif flux < 1e-6: return "B"
    elif flux < 1e-5: return "C"
    elif flux < 1e-4: return "M"
    else: return "X"

def get_alert_level(flare_class: str) -> str:
    if flare_class in ["A", "B"]: return "NORMAL"
    elif flare_class == "C": return "WATCH"
    elif flare_class == "M": return "WARNING"
    else: return "EMERGENCY"

async def fetch_current_flux() -> dict:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(GOES_1DAY)
            r.raise_for_status()
            data = r.json()
            if not data:
                return {}
            latest = data[-1]
            flux = float(latest["flux"])
            flare_class = classify_flare(flux)
            return {
                "time": latest["time_tag"],
                "flux": flux,
                "flux_scientific": f"{flux:.2e}",
                "noaa_class": flare_class,
                "alert_level": get_alert_level(flare_class),
                "satellite": latest.get("satellite", ""),
            }
        except Exception as e:
            print(f"Error fetching current flux: {e}")
            return {}

async def fetch_flux_history(hours: int = 24) -> list[dict]:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(GOES_1DAY)
            r.raise_for_status()
            data = r.json()
            cutoff = datetime.utcnow() - timedelta(hours=hours)
            history = []
            for item in data:
                time_tag = datetime.strptime(item["time_tag"], "%Y-%m-%dT%H:%M:%SZ")
                if time_tag >= cutoff:
                    flux = float(item["flux"])
                    history.append({
                        "time": item["time_tag"],
                        "flux": flux,
                        "class": classify_flare(flux)
                    })
            return history
        except Exception as e:
            print(f"Error fetching flux history: {e}")
            return []

async def fetch_flare_events(days: int = 7) -> list[dict]:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get(FLARE_EVENTS)
            r.raise_for_status()
            data = r.json()
            cutoff = datetime.utcnow() - timedelta(days=days)
            events = []
            for item in data:
                begin_time_str = item.get("begin_time")
                if not begin_time_str: continue
                begin_time = datetime.strptime(begin_time_str, "%Y-%m-%dT%H:%M:%SZ")
                if begin_time >= cutoff:
                    events.append({
                        "class": item.get("max_class"),
                        "begin_time": item.get("begin_time"),
                        "max_time": item.get("max_time"),
                        "end_time": item.get("end_time"),
                        "region": item.get("region", "")
                    })
            return events
        except Exception as e:
            print(f"Error fetching flare events: {e}")
            return []
