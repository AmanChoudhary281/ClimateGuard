def calculate_heat_risk(temperature, humidity):

    if temperature >= 40:
        return "SEVERE"

    elif temperature >= 35:
        if humidity >= 60:
            return "SEVERE"
        else:
            return "HIGH"

    elif temperature >= 30:
        if humidity >= 60:
            return "HIGH"
        else:
            return "MODERATE"

    else:
        return "LOW"