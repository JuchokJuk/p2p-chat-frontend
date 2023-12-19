// source: https://youtu.be/KPoeNZZ6H4s

export default class SecondOrderDynamics {
	value: number;
	valueDelta: number;

	k1: number;
	k2: number;

	constructor(f: number, z: number, startValue: number) {
		this.k1 = z / (Math.PI * f);
		this.k2 = 1 / (2 * Math.PI * f) ** 2;

		this.value = startValue;
		this.valueDelta = 0;
	}

	update(deltaTime: number, targetValue: number) {
		if (deltaTime > 1 / 30) deltaTime = 1 / 30;

		const k2_stable = Math.max(
			this.k2,
			(deltaTime ** 2 + deltaTime * this.k1) / 2,
			deltaTime * this.k1
		);

		this.value += deltaTime * this.valueDelta;
		this.valueDelta +=
			(deltaTime * (targetValue - this.value - this.k1 * this.valueDelta)) / k2_stable;

		return this.value;
	}
}
