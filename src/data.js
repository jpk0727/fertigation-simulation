
export class Reservoir {
  name = "A";
  size = 1000;
  volume = 100;
  limit = 800;
  flowrate = 200; // gph
  pumps = [];
  filling = true;

  constructor() {
    // ph rule
    var rule1 = new Rule(measurements[0], solutions[1], 5);
    // ec rule
    var rule2 = new Rule(measurements[1], solutions[0], 1000);
    var pump1 = new Pump(rule1);
    var pump2 = new Pump(rule2);
    this.pumps = [pump1, pump2];
  }

  get fullness() {
    return this.volume / this.size;
  }

  set updateFilling(value) {
    this.filling = value 
  }

  set addPump(pump) {
    this.pumps = this.pumps.concat(pump);
  }
}

export class Rule {
  constructor(measurement, solution, setpoint) {
    this.solution = solution.name;
    this.measurement = measurement.name;
    this.setpoint = setpoint;
    this.value = measurement.defaultValue;
  }
}

export class Pump {
  speed = 10; // oz per hour
  constructor(rule) {
    this.rule = rule;
    this.name = rule.solution;
  }
}

export class Farm {
  reservoirs = [new Reservoir()];
  constructor(capacity) {
    this.capacity = capacity;
    this.plants = [...Array(capacity).fill(0)];
    // need to fill with unique plant instances, not just copy of same instance
    this.plants = this.plants.map(plant => new Plant());
  }
}

export class Plant {
  age = 0;
  size = 0;
}

export const solutions = [
  {
    name: 'nutrients'
  }, 
  {
    name: 'ph-up'
  },
  {
    name: 'ph-down'
  }
]

export const measurements = [
  {
    name: 'ph',
    defaultValue: 4,
    minValue: 0,
    maxValue: 14
  }, 
  {
    name: 'ec',
    defaultValue: 0,
    minValue: 0,
    maxValue: 3000
  },
  {
    name: 'orp',
    minValue: 0,
    maxValue: 1000,
    defaultValue: 400
  }
]

export const plant_biology = [
  {
    measurement: 'ph',
    rate: .0001 // each plant increases ph by this rate for each day old that plant is. A 2 day old plant changes by 2X.
  },
  {
    measurement: 'ec',
    rate: .01 
  },
  {
    measurement: 'orp',
    rate: .01 
  }
]

export const formulas = [
  {
    solution: solutions[0],
    measurement: measurements[1],
    rate: 5000 // impact on EC for 1 gallon of working stock is .02
  },
  {
    solution: solutions[1],
    measurement: measurements[0],
    rate: 10  // ph-up
  },
  {
    solution: solutions[2],
    measurement: measurements[0],
    rate: -10 // ph-down
  }
]
