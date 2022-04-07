import "bootstrap/dist/css/bootstrap.min.css";
import "./styles.css";
import { measurements, Pump, Reservoir, Rule, solutions, Farm, formulas, plant_biology } from "./data";
import { useEffect, useState } from "react";
import _ from "lodash";
import Turtle from "react-turtle";
import { Accordion, Badge, Button, Card, Col, Container, Form, FormControl, Row, Table } from "react-bootstrap";
import { useInterval } from "./hooks";

export default function App() {
    const [play, setPlay] = useState(false);
    const [game, setGame] = useState({
        day: 0,
        hour: 0,
        totalHours: 0,
        farm: new Farm(100)
    });
    useInterval(() => {
        if (play) {
            advance(4);
        }
    }, 1000);

    const debug = () => {
        console.log(
            game.totalHours,
            game.farm
        );
    };

    const updateFarm = (farm) => {
        setGame({
            ...game,
            farm: farm
        })
    };

    const grow = (newGame, hours = 1) => {
        newGame.farm.reservoirs.forEach(reservoir => {
            newGame.farm.plants.forEach(plant => {
                plant.age += hours;
                reservoir.pumps.forEach(pump => {
                    plant_biology.forEach(fact => {
                        if (fact.measurement === pump.rule.measurement) {
                            pump.rule.value -= fact.rate * plant.age;
                        }
                    })
                    reservoir.volume -= plant.age * .1 / 24; // about 1 gallon a day at full growth
                });
                console.log(plant.yield);
            });
            // calculate the total variance for each of the rules
            var total_variance = reservoir.pumps.map(pump => pump.rule.variance).reduce((a, b) => a + b, 0) / reservoir.pumps.length;
            // update each plants size after the resevoir has been dosed;
            newGame.farm.plants.forEach(plant => {
                plant.size += hours * total_variance;
            })
        });
        return newGame
    };

    const dose = (newGame, hours = 1) => {
        newGame.farm.reservoirs.forEach(reservoir => {
            reservoir.pumps.forEach(pump => {
                formulas.forEach(formula => {
                    if (formula.solution.name === pump.rule.solution) {
                        if (formula.rate > 0) {
                            pump.rule.value = Math.max(0, pump.rule.value < pump.rule.setpoint ? pump.rule.value + pump.speed * hours * (formula.rate / reservoir.volume) : pump.rule.value);
                        } else {
                            pump.rule.value = Math.max(0,pump.rule.value > pump.rule.setpoint ? pump.rule.value + pump.speed * hours * (formula.rate / reservoir.volume) : pump.rule.value);
                        }
                    }
                })
            })
        })
        return newGame;
    };

    const fill = (newGame, hours = 1) => {
        newGame.farm.reservoirs.forEach(reservoir => {
            var new_volume = reservoir.volume;
            if (reservoir.filling) {
                if (new_volume < reservoir.limit) {
                    new_volume = Math.min(reservoir.limit, hours * reservoir.flowrate + reservoir.volume);
                }
            }
            reservoir.volume = new_volume;
        });
        return newGame;
    };

    const updateReservoir = (name, data) => {
        setGame({
            ...game,
            farm: {
                ...game.farm,
                reservoirs: game.farm.reservoirs.map(res => {
                    if (res.name === name) return { ...res, ...data };
                    else return res;
                })
            }
        })
    };

    var advance = (hours = 1) => {
        var totalHours = game.totalHours + hours;
        var day = Math.floor(game.totalHours / 24)
        var hour = totalHours % 24;
        var newGame = _.cloneDeep(game);
        newGame = fill(newGame, hours);
        newGame = dose(newGame, hours);
        newGame = grow(newGame, hours);
        setGame({
            ...newGame,
            totalHours: totalHours,
            day: day,
            hour: hour,
        });
        debug();
    };

    return (
        <>
            <div className="w-100 d-flex nav">
                <Container>
                    <Row className="w-100 d-flex">
                        <Col className="d-flex align-items-center">
                            <h4>
                                Fertigation Simulator: Jess Karol
                            </h4>
                        </Col>
                        <Col className="d-flex justify-content-end p-0 m-0">
                            <Button disabled className="m-2">{`DAY: ${game.day} HOUR: ${game.hour}`}</Button>
                            <Button className="m-2" variant={play ? "danger" : "success"} onClick={() => setPlay(!play)}>{play ? "STOP" : "PLAY"}</Button>
                            <Button className="ml-2 mt-2 mb-2 mr-0" onClick={() => advance()} disabled={play}>ADVANCE</Button>
                        </Col>
                    </Row>
                </Container>
            </div>
        <Container>
            <Row className="">
                <Col>
                    <Information/>
                </Col>
            </Row>
            <Row className="">
                <Col>
                    <FarmGraphic farm={game.farm} />
                </Col>
            </Row>
            <Row className="">
                <Col>
                    {game.farm.reservoirs.map((reservoir, index) => {
                        return (
                            <>
                                <ReservoirGraphic reservoir={reservoir} key={index} update={updateReservoir} />
                            </>
                        )
                    })}
                </Col>
            </Row>
            <Row>
                <Col>
                    <AddPump farm={game.farm} updateFarm={updateFarm} />
                </Col>
            </Row>
        </Container>
        </>
    );
}


function AddPump({ farm, updateFarm }) {
    const [solution, setSolution] = useState();
    const [measurement, setMeasurement] = useState();
    const [reservoir, setreservoir] = useState();
    const [setPoint, setSetPoint] = useState();
    var submit = (e) => {
        e.preventDefault();
        var newFarm = _.cloneDeep(farm);
        var res = newFarm.reservoirs[reservoir];
        var rule = new Rule(measurements[measurement], solutions[solution], setPoint)
        var pump = new Pump(rule);
        res.addPump = pump;
        updateFarm(newFarm);
    }
    return (
        <Card className="m-2">
            <Accordion>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Add Pump</Accordion.Header>
                    <Accordion.Body>
                        <Form>
                            <Form.Group>
                                <Form.Label>Reservoir</Form.Label>
                                <Form.Select onChange={(e) => setreservoir(e.target.value)}>
                                    <option>Select a reservoir</option>
                                    {farm.reservoirs.map((reservoir, index) => {
                                        return <option key={index} value={index}>{reservoir.name}</option>
                                    })}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Measurement</Form.Label>
                                <Form.Select onChange={(e) => setMeasurement(e.target.value)}>
                                    <option>Select a measurment</option>
                                    {measurements.map((measurement, index) => {
                                        return <option key={index} value={index}>{measurement.name}</option>
                                    })}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Solution</Form.Label>
                                <Form.Select onChange={(e) => setSolution(e.target.value)}>
                                    <option>Select a Solution Type</option>
                                    {solutions.map((solution, index) => {
                                        return <option key={index} value={index}>{solution.name}</option>
                                    })}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group>
                                <Form.Label>Setpoint</Form.Label>
                                <Form.Control disabled={!measurement} type="number" onChange={(e) => setSetPoint(e.target.value)}></Form.Control>
                            </Form.Group>
                            <Button variant="primary" type="submit" onClick={submit} className="mt-3">
                                Add
                            </Button>
                        </Form>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </Card>
    )

};

function FarmGraphic({ farm }) {
    return (
        <Card className="m-2">
            <Card.Header>Your Farm</Card.Header>
            <Row>
                {farm.plants.map((plant, index) => {
                    return (
                        <div key={index} className="pot d-flex justify-content-center align-items-center">
                            <p>{plant.yield}</p>
                            {/*<span className="plant" style={{ transform: `scale(${plant.yield*10})` }} />*/}
                        </div>
                    )
                })}
            </Row>
        </Card>
    )
};

function ReservoirGraphic({ reservoir, update }) {
    return (
        <Card className="m-2">
            <Card.Header>Reservoir {reservoir.name}</Card.Header>
            <Row>
                <Col>
                    <div className="reservoir d-flex flex-column justify-content-end">
                        <div className="fluid" style={{ height: `${200 * reservoir.fullness}px` }}>
                        </div>
                    </div>
                </Col>
                <Col>
                    <div className="d-flex justify-content-between m-2">
                        <h4>Reservoir: {reservoir.name}</h4>
                        <Form.Check
                            type="switch"
                            id="autofill-switch"
                            checked={reservoir.filling}
                            onChange={() => update(reservoir.name, {filling: !reservoir.filling})}
                            label={reservoir.filling ? "Auto-Fill ON" : "Auto-Fill OFF"}
                        />
                    </div>
                    <h5>
                        <Badge pill bg="info" className="m-1">Volume: {reservoir.volume.toFixed(0)} gallons</Badge>
                        <Badge pill bg="info" className="m-1">Limit: {reservoir.limit} gallons</Badge>
                        <Badge pill bg="info" className="m-1">Tank Size: {reservoir.size} gallons</Badge>
                        <Badge pill bg="info" className="m-1">Flow Rate: {reservoir.flowrate}/hr</Badge>
                        <Badge pill bg="info" className="m-1">Pumps: {reservoir.pumps.length} ct</Badge>
                    </h5>
                </Col>
            </Row>
            <Row>
                <Col className="m-2">
                    <h5>Pump Rules</h5>
                    <Table className="">
                        <thead>

                            <tr>
                                <th>Solution</th>
                                <th>Measurment</th>
                                <th>Setpoint</th>
                                <th>Variance</th>
                                <th>Current Value</th>
                                <th>Speed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservoir.pumps.map((pump, index) => {
                                return <tr key={index}>
                                    <td>{pump.rule.solution}</td>
                                    <td>{pump.rule.measurement}</td>
                                    <td>{pump.rule.setpoint}</td>
                                    <td>{pump.rule.variance.toFixed(4)}</td>
                                    <td>{pump.rule.value.toFixed(4)}</td>
                                    <td>  
                                        <Form.Range min={0} max={200} value={pump.speed} onChange={(e) => update(reservoir.name, {
                                            pumps: reservoir.pumps.map(p => {
                                                if (p.name === pump.name) return {...p, speed: parseInt(e.target.value)};
                                                else return p;
                                            })})
                                        } />
                                    </td>
                                </tr>
                            })}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </Card>
    )

};

function Information() {
    return (
        <Card className="m-2">
            <Accordion>
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Simulation Information</Accordion.Header>
                    <Accordion.Body>
                        This simulation models the interaction between nutrient tanks and dosign systems (fertigation) with a plant environment. As plants grow, they take up more resources (water, nutrients) and impact the pH and other sensors readings in the water. 
                        The system is designed to add water, nutrients, and pH buffer as concentrations are changed in the tank. However, the speed at which to add consentrated solution to the tank is manually controlled using slider inputs. 
                        <br/>
                        <br/>
                        <h6>
                            TODO:
                            </h6> 
                        <ul>
                            <li>Make growth rate of plants change based on sensor readings</li>
                            <li>Calculate yield for the crops based on their growth</li>
                            <li>Create end of the simliation with some results (such as yield)</li>
                            <li>Historize sensor readings to show values over time</li>
                            <li>Add ORP as a rule with dosing of hydrocloric acid</li>
                            <li>Setup multiple plant types with different growth rates</li>
                        </ul>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </Card>

    )
};

