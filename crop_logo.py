from PIL import Image

def crop_transparent(image_path, output_path):
    img = Image.open(image_path)
    img = img.convert("RGBA")
    
    # Get bounding box of non-transparent pixels
    bbox = img.getbbox()
    
    if bbox:
        # Crop the image to the bounding box
        img_cropped = img.crop(bbox)
        img_cropped.save(output_path, "PNG")
        print(f"Cropped image saved to {output_path}")
    else:
        print("Image is entirely transparent or bounding box not found.")

if __name__ == "__main__":
    src = r"c:\Users\thars\Downloads\Clarity-CRM\frontend\public\logo.png"
    dest = r"c:\Users\thars\Downloads\Clarity-CRM\frontend\public\logo.png"
    crop_transparent(src, dest)
