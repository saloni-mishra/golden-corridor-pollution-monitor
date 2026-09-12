from __future__ import annotations

from app.models.schemas import Factory, FactoryLocation, FactoryStatus

FACTORIES: list[Factory] = [
    Factory(
        id="VAPI-A",
        name="Vapi Chemical Complex A",
        location=FactoryLocation(
            city="Vapi",
            lat=20.3755,
            lon=72.9072,
            proximity_to_population="High",
        ),
        industry_type="Chemical Manufacturing",
        current_status=FactoryStatus.NORMAL,
    ),
    Factory(
        id="VAPI-B",
        name="Vapi Pharma Manufacturing Unit B",
        location=FactoryLocation(
            city="Vapi",
            lat=20.3811,
            lon=72.9130,
            proximity_to_population="Medium",
        ),
        industry_type="Pharmaceutical",
        current_status=FactoryStatus.NORMAL,
    ),
    Factory(
        id="ANK-4",
        name="Ankleshwar Dyes Unit 4",
        location=FactoryLocation(
            city="Ankleshwar",
            lat=21.6270,
            lon=73.0027,
            proximity_to_population="High",
        ),
        industry_type="Dye Manufacturing",
        current_status=FactoryStatus.NORMAL,
    ),
    Factory(
        id="ANK-C",
        name="Ankleshwar Specialty Chemicals C",
        location=FactoryLocation(
            city="Ankleshwar",
            lat=21.6310,
            lon=73.0080,
            proximity_to_population="Medium",
        ),
        industry_type="Specialty Chemicals",
        current_status=FactoryStatus.NORMAL,
    ),
]

FACTORY_MAP: dict[str, Factory] = {f.id: f for f in FACTORIES}
