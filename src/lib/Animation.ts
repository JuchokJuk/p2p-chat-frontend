import SecondOrderDynamics from './SecondOrderDynamics';

export default class Animation {
	requestId?: number;
	prevTime?: number;
	animating = false;
	secondOrderDynamics;
	value;
	targetValue;
	epselon;
	onChange;

	constructor(
		f: number,
		z: number,
		startValue: number,
		epselon: number,
		onChange: (value: number) => void
	) {
		this.secondOrderDynamics = new SecondOrderDynamics(f, z, startValue);
		this.value = startValue;
		this.targetValue = startValue;
		this.epselon = epselon;
		this.onChange = onChange.bind(this);
		this.loop = this.loop.bind(this);
	}

	animate(targetValue: number) {
		this.targetValue = targetValue;
        if (this.animating || Math.abs(this.value - this.targetValue) <= this.epselon) return;

		this.animating = true;
		this.prevTime = performance.now();
		this.requestId = requestAnimationFrame(this.loop);
	}

	loop() {
		const currentTime = performance.now();
		const deltaTime = currentTime - this.prevTime!;

		this.value = this.secondOrderDynamics.update(deltaTime * 0.001, this.targetValue);
		this.onChange(this.value);

		if (Math.abs(this.value - this.targetValue) > this.epselon) {
			this.prevTime = currentTime;
			this.requestId = requestAnimationFrame(this.loop);
		} else {
			this.animating = false;
		}
	}

	destroy() {
		if (this.requestId !== undefined) cancelAnimationFrame(this.requestId);
	}
}
