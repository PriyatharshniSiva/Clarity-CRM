from PIL import Image

def remove_black(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    # We want to remove black pixels and leave the blue text.
    # A soft threshold can be applied by checking the maximum of RGB.
    # If the pixel is very dark (max(R,G,B) < 20), make it fully transparent.
    # We can also do a soft transition for anti-aliasing if we want,
    # but a simple threshold is usually enough for a quick fix.
    
    datas = img.getdata()
    newData = []
    for item in datas:
        # item is (R, G, B, A)
        # The blue text has a higher blue value, e.g., (10, 50, 100)
        # Black background is around (0, 0, 0) to (15, 15, 15)
        # Let's say if it's less than 25 on all channels, it's black.
        
        # Calculate perceived brightness or just simple max
        if item[0] < 25 and item[1] < 25 and item[2] < 25:
            # Fully transparent
            newData.append((255, 255, 255, 0))
        elif item[0] < 45 and item[1] < 45 and item[2] < 45:
            # Semi-transparent for anti-aliasing
            # Use the max value to determine alpha (0-255)
            # Map 25 -> 0, 45 -> 255
            alpha = int(((max(item[:3]) - 25) / 20.0) * 255)
            newData.append((item[0], item[1], item[2], alpha))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")

if __name__ == "__main__":
    src = r"C:\Users\thars\.gemini\antigravity-ide\brain\926f5d54-a32a-49ef-9964-c2fac67ed4c7\media__1787310842018.jpg"
    dest = r"c:\Users\thars\Downloads\Clarity-CRM\frontend\public\logo.png"
    remove_black(src, dest)
    print("Successfully removed black background and saved as PNG.")
