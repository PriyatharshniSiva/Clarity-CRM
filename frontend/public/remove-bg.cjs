const { Jimp } = require('jimp');

async function removeWhiteBg() {
  try {
    const image = await Jimp.read('favicon.png');
    
    // Iterate over every pixel
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function(x, y, idx) {
      const red = this.bitmap.data[idx + 0];
      const green = this.bitmap.data[idx + 1];
      const blue = this.bitmap.data[idx + 2];
      const alpha = this.bitmap.data[idx + 3];

      // If the pixel is white or very close to white, make it transparent
      if (red > 240 && green > 240 && blue > 240) {
        this.bitmap.data[idx + 3] = 0;
      }
    });

    await image.write('favicon-clear.png');
    console.log('Successfully created favicon-clear.png');
  } catch (err) {
    console.error('Error:', err);
  }
}

removeWhiteBg();
