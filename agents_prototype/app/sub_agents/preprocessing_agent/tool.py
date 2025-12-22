import cv2
import numpy as np
import os
from google.adk.tools import ToolContext

def deskew_pil_image(pil_img):
    """
    Deskew image safely without 90-degree rotations.
    """
    img = np.array(pil_img)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)

    _, thresh = cv2.threshold(
        gray, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    coords = np.column_stack(np.where(thresh > 0))
    if len(coords) < 100:
        return img

    angle = cv2.minAreaRect(coords)[-1]

    if angle < -45:
        angle = 90 + angle

    # Correct only small skew angles
    if abs(angle) > 10 or abs(angle) < 0.5:
        return img

    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)

    return cv2.warpAffine(
        img, M, (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )



def run_preprocessing(tool_context: ToolContext):
    """
    Retrieves 'image_paths' from state, loads them, applies deskew + grayscale,
    saves results to disk, and stores new paths in 'preprocessed_image_paths'.
    """
    input_paths = tool_context.state.get("image_paths", [])
    if not input_paths:
        return "No image paths found in state['image_paths']. Check previous step."

    output_dir = os.path.join(os.path.dirname(input_paths[0]), "..", "preprocessed")
    os.makedirs(output_dir, exist_ok=True)
    
    processed_paths = []
    
    for idx, path in enumerate(input_paths):
        if not os.path.exists(path):
            continue
            
        # Load image via cv2 directly
        # Note: cv2.imread loads as BGR, but deskew logic expects RGB (or we adapt it)
        # However, our deskew tool takes PIL logic originally, let's stick to reading as PIL to reuse logic
        # OR just adapt to cv2 completely.
        # Let's use PIL to load to be safe with existing deskew_pil_image function if possible,
        # BUT deskew_pil_image takes PIL. Let's load as PIL.
        
        try:
            from PIL import Image
            pil_img = Image.open(path)
            
            # 1. Deskew
            deskewed_np = deskew_pil_image(pil_img)
            
            # 2. Grayscale (if not already)
            if len(deskewed_np.shape) == 3:
                gray = cv2.cvtColor(deskewed_np, cv2.COLOR_RGB2GRAY)
            else:
                gray = deskewed_np
                
            # Save processed image
            out_path = os.path.join(output_dir, f"proc_page_{idx}.png")
            cv2.imwrite(out_path, gray)
            processed_paths.append(out_path)
            
        except Exception as e:
            print(f"Error processing {path}: {e}")

    tool_context.state["preprocessed_image_paths"] = processed_paths
    
    return f"Successfully preprocessed {len(processed_paths)} images. Stored in state['preprocessed_image_paths']."
