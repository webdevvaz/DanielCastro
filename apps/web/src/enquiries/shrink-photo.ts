/** Longest edge, in pixels, of a photo the form uploads. The server scales it down further. */
const MAX_EDGE = 2000;

const JPEG_QUALITY = 0.85;

/** Reads an image, upright from its camera orientation, or null when the browser cannot. */
const readImage = async (file: File) => {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return null;
  }
};

/**
 * A smaller JPEG copy of a photo, so a phone's 10 MB pictures upload quickly: at most `MAX_EDGE`
 * pixels on the longest edge, on a white background for transparent images. Returns null when the
 * browser cannot read the file as an image, such as a HEIC photo on a desktop browser.
 */
export async function shrinkPhoto(file: File) {
  const image = await readImage(file);

  if (image === null) return null;

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (context === null) {
    image.close();

    return null;
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  image.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
  });

  if (blob === null) return null;

  const name = `${file.name.replace(/\.[^.]*$/, "") || "photo"}.jpg`;

  return new File([blob], name, { type: "image/jpeg" });
}
