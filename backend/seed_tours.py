"""Seed ten published Mumbai and Delhi tours into the configured PostgreSQL database.

Run from the backend directory:
    ../myvenv/Scripts/python.exe seed_tours.py
"""

from __future__ import annotations

from datetime import date
import os

import db_models


ASSET_BASE_URL = os.getenv("ASSET_BASE_URL", "http://localhost:8000").rstrip("/")

TOURS = (
    {
        "title": "Mumbai City Essentials",
        "description": "See Mumbai's best-known waterfront landmarks, historic streets and local neighbourhood stories with an experienced city guide.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/mumbai-city-essentials.png",
        "city": "Mumbai", "mode": "Shared", "trip_type": "One-day trip", "category": "City", "duration": "8 hours",
        "price": 3200, "capacity": 12, "departure_date": date(2026, 9, 6), "guide_name": "Aarav Mehta",
        "highlights": ["Gateway of India", "Marine Drive", "Local lunch"], "tag": "Best seller", "featured": True, "dark": False, "published": True,
    },
    {
        "title": "South Mumbai Heritage Walk",
        "description": "Walk through Kala Ghoda, the Fort district and Mumbai's Victorian-era architecture with stories that bring the city to life.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/south-mumbai-heritage-walk.png",
        "city": "Mumbai", "mode": "Shared", "trip_type": "One-day trip", "category": "Heritage", "duration": "4 hours",
        "price": 2200, "capacity": 14, "departure_date": date(2026, 9, 13), "guide_name": "Aarav Mehta",
        "highlights": ["Kala Ghoda", "Fort district", "Art Deco landmarks"], "tag": "Heritage", "featured": False, "dark": False, "published": True,
    },
    {
        "title": "Mumbai Street Food Trail",
        "description": "Taste Mumbai through its favourite snacks and family-run kitchens, from Vada Pav to regional sweets and chai.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/mumbai-street-food-trail.png",
        "city": "Mumbai", "mode": "Shared", "trip_type": "One-day trip", "category": "Food", "duration": "3.5 hours",
        "price": 2400, "capacity": 10, "departure_date": date(2026, 9, 20), "guide_name": "Nisha Shah",
        "highlights": ["Vada Pav tasting", "Old-school cafes", "Vegetarian options"], "tag": "Foodie pick", "featured": True, "dark": False, "published": True,
    },
    {
        "title": "Dharavi Community Experience",
        "description": "A respectful, resident-led look at Dharavi's makers, small businesses and the communities that power the neighbourhood.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/dharavi-community-experience.png",
        "city": "Mumbai", "mode": "Private", "trip_type": "One-day trip", "category": "Community", "duration": "3 hours",
        "price": 2800, "capacity": 8, "departure_date": date(2026, 9, 27), "guide_name": "Imran Khan",
        "highlights": ["Resident-led route", "Craft workshops", "Ethical tourism"], "tag": "Local insight", "featured": False, "dark": True, "published": True,
    },
    {
        "title": "Ganesh Festival in Mumbai",
        "description": "Experience Mumbai's Ganesh festival traditions, neighbourhood decorations and seasonal food with a guide who knows the celebrations.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/mumbai-ganesh-festival.png",
        "city": "Mumbai", "mode": "Shared", "trip_type": "Weekly trip", "category": "Festival", "duration": "2 days",
        "price": 7800, "capacity": 10, "departure_date": date(2026, 9, 19), "guide_name": "Nisha Shah",
        "highlights": ["Festival pandals", "Seasonal sweets", "Local traditions"], "tag": "Seasonal", "featured": True, "dark": False, "published": True,
    },
    {
        "title": "Old Delhi & New Delhi Discovery",
        "description": "Travel from Old Delhi's lanes and markets to New Delhi's grand avenues on an immersive full-day city introduction.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/delhi-city-discovery.png",
        "city": "Delhi", "mode": "Shared", "trip_type": "One-day trip", "category": "City", "duration": "8 hours",
        "price": 3400, "capacity": 12, "departure_date": date(2026, 9, 5), "guide_name": "Riya Kapoor",
        "highlights": ["Jama Masjid area", "India Gate", "Private transport"], "tag": "Best seller", "featured": True, "dark": False, "published": True,
    },
    {
        "title": "Delhi Heritage & Haveli Walk",
        "description": "Follow a local historian through Shahjahanabad's havelis, hidden courtyards and layered Mughal-era stories.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/delhi-heritage-haveli-walk.png",
        "city": "Delhi", "mode": "Shared", "trip_type": "One-day trip", "category": "Heritage", "duration": "4.5 hours",
        "price": 2300, "capacity": 14, "departure_date": date(2026, 9, 12), "guide_name": "Riya Kapoor",
        "highlights": ["Historic havelis", "Chandni Chowk", "Local chai"], "tag": "History", "featured": False, "dark": False, "published": True,
    },
    {
        "title": "Delhi Food & Bazaar Trail",
        "description": "Explore the flavours and energy of Old Delhi's markets with guided tastings and practical local food guidance.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/delhi-food-bazaar-trail.png",
        "city": "Delhi", "mode": "Shared", "trip_type": "One-day trip", "category": "Food", "duration": "4 hours",
        "price": 2600, "capacity": 10, "departure_date": date(2026, 9, 26), "guide_name": "Kabir Malhotra",
        "highlights": ["Market tastings", "Spice lanes", "Vegetarian options"], "tag": "Foodie pick", "featured": True, "dark": False, "published": True,
    },
    {
        "title": "Mehrauli Archaeological Park Walk",
        "description": "Slow down among Delhi's tombs, gardens and lesser-known monuments on a private walk through Mehrauli's layered landscape.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/mehrauli-archaeological-park-walk.png",
        "city": "Delhi", "mode": "Private", "trip_type": "One-day trip", "category": "Culture", "duration": "3.5 hours",
        "price": 3100, "capacity": 8, "departure_date": date(2026, 10, 3), "guide_name": "Kabir Malhotra",
        "highlights": ["Qutub complex area", "Hidden monuments", "Garden walk"], "tag": "Quiet Delhi", "featured": False, "dark": True, "published": True,
    },
    {
        "title": "Diwali Markets of Delhi",
        "description": "Celebrate the festive season with Delhi's decorated bazaars, artisan gifts and seasonal flavours on a two-day cultural escape.",
        "image_url": f"{ASSET_BASE_URL}/static/tours/delhi-diwali-markets.png",
        "city": "Delhi", "mode": "Shared", "trip_type": "Weekly trip", "category": "Festival", "duration": "2 days",
        "price": 8200, "capacity": 10, "departure_date": date(2026, 11, 1), "guide_name": "Riya Kapoor",
        "highlights": ["Festive bazaars", "Artisan shopping", "Diwali treats"], "tag": "Seasonal", "featured": True, "dark": False, "published": True,
    },
)


def main() -> None:
    db_models.initialize_database()
    created = 0
    updated = 0
    for tour in TOURS:
        with db_models.database() as connection:
            exists = db_models._fetch_one(
                connection,
                "SELECT id FROM tours WHERE title = %s AND city = %s",
                (tour["title"], tour["city"]),
            )
        if exists:
            db_models.save_tour(tour, int(exists["id"]))
            updated += 1
            continue
        db_models.save_tour(tour)
        created += 1
    print(f"Tours created: {created}; updated: {updated}.")


if __name__ == "__main__":
    main()
