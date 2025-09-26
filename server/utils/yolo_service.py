import os
import io
from typing import Any, Dict, List, Tuple

import numpy as np
from PIL import Image
from ultralytics import YOLO
import cv2


class YoloChartAnalyzer:
    def __init__(self) -> None:
        model_path = os.getenv("CHART_MODEL_PATH") or os.getenv("YOLO_MODEL_PATH") or "model.pt"
        if not os.path.exists(model_path):
            raise FileNotFoundError(
                f"YOLO model file not found at '{model_path}'. Set CHART_MODEL_PATH env to a valid .pt file"
            )
        self.model = YOLO(model_path)

    def analyze_pil(self, image: Image.Image) -> Tuple[List[Dict[str, Any]], Image.Image]:
        img_rgb = image.convert("RGB")
        img_np = np.array(img_rgb)

        results = self.model(img_np)

        patterns: List[Dict[str, Any]] = []
        names = getattr(self.model, "names", {}) or {}

        boxes = getattr(results[0], "boxes", None)
        if boxes is not None:
            # boxes.cls (tensor), boxes.conf, boxes.xyxy
            cls_list = boxes.cls.tolist()
            conf_list = boxes.conf.tolist()
            xyxy = boxes.xyxy.cpu().numpy().tolist()
            for idx, cls_id in enumerate(cls_list):
                name = names.get(int(cls_id), str(int(cls_id)))
                confidence = float(conf_list[idx])
                bbox = xyxy[idx]
                patterns.append(
                    {
                        "pattern": name,
                        "confidence": round(confidence, 3),
                        "bbox": bbox,
                    }
                )

        # Annotate image
        img_bgr = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
        for p in patterns:
            x1, y1, x2, y2 = [int(v) for v in p["bbox"]]
            cv2.rectangle(img_bgr, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f"{p['pattern']} {p['confidence']*100:.1f}%"
            cv2.putText(
                img_bgr,
                label,
                (x1, max(0, y1 - 10)),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                (0, 255, 0),
                2,
                cv2.LINE_AA,
            )
        annotated = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
        return patterns, annotated


# Global singleton
_analyzer: YoloChartAnalyzer | None = None


def get_chart_analyzer() -> YoloChartAnalyzer:
    global _analyzer
    if _analyzer is None:
        _analyzer = YoloChartAnalyzer()
    return _analyzer


