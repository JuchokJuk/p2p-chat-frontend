export function inscribe(
	inscribedRectangle: { width: number; height: number },
	targetRectangle: { width: number; height: number },
	targetRectangleAspectRation: number // skip aspect ratio calc for target rectangle
) {
	if (targetRectangleAspectRation >= inscribedRectangle.width / inscribedRectangle.height) {
		return [
			(inscribedRectangle.width * targetRectangle.height) / inscribedRectangle.height,
			targetRectangle.height
		];
	} else {
		return [
			targetRectangle.width,
			(inscribedRectangle.height * targetRectangle.width) / inscribedRectangle.width
		];
	}
}
