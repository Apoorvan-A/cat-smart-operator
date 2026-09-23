# Demo

Owner: Claude 4. Target: **5–7 minutes**, one continuous operational story, fully
deterministic and repeatable. Scenarios are driven by `demo/scenarios/*.json` and
the simulator, not by hand-clicking.

## The story (single narrative)

> The operator starts their shift. The system verifies safety, understands the
> assigned task and machine, continuously processes telemetry, detects a proximity
> hazard, identifies abnormal idling, dynamically updates the task ETA from
> environmental conditions, explains the situation through the grounded AI
> assistant, and automatically prepares the shift handover.

## Run order

1. **Operator login** → Command Center (am I safe / healthy / on track).
2. **Today's task** assigned, machine healthy, normal productivity.
3. **Pre-start safety check** passes.
4. **Start task** → live operation.
5. **Proximity hazard** — worker enters 3.2 m (threshold 5 m) → HIGH alert on
   map → operator acknowledges → audit record.
6. **Excessive idling** — idle time rises above operator baseline → unusual-
   operation insight (WHAT/WHY/ACTION).
7. **Machine health anomaly** — temperature/fuel pattern shifts → severity +
   inspection recommendation.
8. **ETA change** — rainfall worsens → predicted ETA moves 14:30 → 14:47 with
   explanation.
9. **AI assistant** — "Why is my task delayed?" → retrieves backend facts →
   grounded explanation.
10. **Shift handover** auto-generated (completed/remaining/safety/health/fuel).
11. **Training recommendation** — "Safe Excavator Operation" because of the
    proximity alerts.

## Deterministic scenarios (also individually runnable)

| # | Scenario | Trigger | Shows |
|---|----------|---------|-------|
| 1 | Normal operation | baseline feed | healthy command center |
| 2 | Seatbelt violation | seatbelt=unfastened & operating | rule→alert→ack→audit |
| 3 | Proximity hazard | worker at 3.2 m | HIGH alert + map + ack |
| 4 | Excessive idling | idle ≫ baseline | unusual-operation insight |
| 5 | Machine health anomaly | temp/fuel drift | anomaly + severity + action |
| 6 | Task delay | worsening weather | ETA change + explanation |
| 7 | AI assistant | "why is my task delayed?" | grounded backend-fact answer |
| 8 | Shift handover | shift end | auto summary |
| 9 | Multiple alerts | burst of related events | grouping/dedup |
| 10 | Missing telemetry | disconnect feed | "Telemetry unavailable", no fake data |

## Reset

`make demo-reset` reseeds the DB and rewinds the simulator so the story replays
identically. Never hardcode demo values in the UI — they come from the seed +
simulator so the system is provably real end-to-end.
