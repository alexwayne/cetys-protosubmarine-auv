"""
Buoyancy and motion physics for the Proto-AUV.

All functions are pure Python — no FastAPI, no database.
They can be called from routes, tested in a REPL, or imported by other services.

Physics reference:
    F_b = ρ · g · V          (Archimedes' principle)
    Δp  = ρ · g · h          (hydrostatic pressure)  →  h = Δp / (ρ · g)
"""

GRAVITY = 9.81          # m/s²
STEPS_PER_REV = 2048    # 28BYJ-48 with gearbox, full-step mode


def steps_to_volume(motor_steps: int, volume_per_step_m3: float) -> float:
    """
    Convert stepper motor position (steps from home) to displaced volume in m³.

    volume_per_step_m3 is a hardware constant determined during calibration —
    how much volume changes per step of the 28BYJ-48.
    """
    return motor_steps * volume_per_step_m3


def buoyancy_force(fluid_density_kg_m3: float, displaced_volume_m3: float) -> float:
    """
    Compute the buoyant force in Newtons.

    F_b = ρ · g · V

    Args:
        fluid_density_kg_m3: density of the fluid (water ≈ 1000, saltwater ≈ 1025)
        displaced_volume_m3: volume of fluid displaced by the AUV
    """
    return fluid_density_kg_m3 * GRAVITY * displaced_volume_m3


def pressure_to_depth(
    pressure_pa: float,
    surface_pressure_pa: float = 101_325.0,
    fluid_density_kg_m3: float = 1000.0,
) -> float:
    """
    Estimate depth in meters from absolute pressure (BMP280 reading).

    Derived from the hydrostatic equation:
        Δp = ρ · g · h  →  h = Δp / (ρ · g)

    A positive return value means the sensor is below the surface.
    A negative value means it is above (e.g., sensor in open air reads
    slightly below standard atmosphere).

    Args:
        pressure_pa:        absolute pressure from the BMP280 (Pascals)
        surface_pressure_pa: atmospheric pressure at the water surface
        fluid_density_kg_m3: density of the fluid being tested in
    """
    delta_p = pressure_pa - surface_pressure_pa
    return delta_p / (fluid_density_kg_m3 * GRAVITY)
