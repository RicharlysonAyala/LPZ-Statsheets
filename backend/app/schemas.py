from dataclasses import dataclass


@dataclass
class StatLine:
    pontos_feitos: int = 0
    pontos_tomados: int = 0
    block: int = 0
    assistencias: int = 0
    erro_ofensivo: int = 0
    erro_defensivo: int = 0


BASE_RATING = 5.0

WEIGHTS = {
    "default": dict(pf=0.6, pt=-0.5, eo=-0.6, ed=-0.6, ast=0.3, blk=0.4),
    "setter": dict(pf=0.5, pt=-0.2, eo=-0.3, ed=-0.3, ast=0.6, blk=0.5),
    "ds_tsk": dict(pf=0.5, pt=-0.3, eo=-0.4, ed=-0.4, ast=0.5, blk=0.0),
}


def calculate_rating(stats: StatLine, role: str) -> float:
    w = WEIGHTS.get(role, WEIGHTS["default"])
    total_actions = (
        stats.pontos_feitos + stats.pontos_tomados + stats.erro_ofensivo
        + stats.erro_defensivo + stats.assistencias + stats.block
    )
    if total_actions == 0:
        return 0.0

    raw = (
        stats.pontos_feitos * w["pf"]
        + stats.pontos_tomados * w["pt"]
        + stats.erro_ofensivo * w["eo"]
        + stats.erro_defensivo * w["ed"]
        + stats.assistencias * w["ast"]
        + stats.block * w["blk"]
    )
    rating = BASE_RATING + raw
    return round(max(0.0, min(10.0, rating)), 1)


def calculate_efficiency(stats: StatLine) -> float:
    positivos = stats.pontos_feitos + stats.assistencias + stats.block
    negativos = stats.erro_ofensivo + stats.erro_defensivo
    total = positivos + negativos + stats.pontos_tomados
    if total == 0:
        return 0.0
    return round((positivos / total) * 100, 1)


def overall_performance(avg_rating: float) -> str:
    if avg_rating >= 9.0:
        return "EXCELENTE"
    if avg_rating >= 7.0:
        return "BOM"
    if avg_rating >= 5.0:
        return "MÉDIO"
    return "RUIM"
