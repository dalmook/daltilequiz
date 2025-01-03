import os
import json
from PIL import Image

def convert_and_resize_images(folder_path, category, output_json_path):
    image_extensions = {"webp", "jpeg", "jpg", "gif", "png"}
    output_folder = os.path.join(folder_path, "converted")
    os.makedirs(output_folder, exist_ok=True)

    json_data = []

    for file_name in os.listdir(folder_path):
        file_path = os.path.join(folder_path, file_name)
        if os.path.isfile(file_path):
            ext = file_name.split(".")[-1].lower()
            if ext in image_extensions:
                try:
                    # Load image and convert to RGB
                    img = Image.open(file_path).convert("RGB")

                    # Resize the image to reduce size below 50KB
                    quality = 85
                    output_path = os.path.join(output_folder, f"{os.path.splitext(file_name)[0]}.jpg")
                    while True:
                        img.save(output_path, "JPEG", quality=quality)
                        if os.path.getsize(output_path) <= 50 * 1024 or quality <= 10:
                            break
                        quality -= 5

                    # Add to JSON data
                    json_data.append({
                        "category": category,
                        "image": os.path.relpath(output_path, folder_path).replace("\\", "/"),
                        "answer": os.path.splitext(file_name)[0]
                    })
                except Exception as e:
                    print(f"Error processing {file_name}: {e}")

    # Save JSON data
    with open(output_json_path, "w", encoding="utf-8") as json_file:
        json.dump(json_data, json_file, ensure_ascii=False, indent=4)

category="singer"
# Example usage
convert_and_resize_images(
    folder_path="C:/Users/chosu/OneDrive/사진/가수/",
    category="singer",
    output_json_path=f"C:/Users/chosu/OneDrive/문서/{category}.json"
)

