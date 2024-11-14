import { CameraEnhancer } from "dynamsoft-camera-enhancer";
import { PlayCallbackInfo } from "dynamsoft-camera-enhancer/dist/types/interface/playcallbackinfo";
import { TextResult, BarcodeReader } from "dynamsoft-javascript-barcode";
import React, { useEffect, useRef, ReactNode } from "react";

export interface ScannerProps {
    isActive?: boolean;
    children?: ReactNode;
    interval?: number;
    license?: string;
    onInitialized?: (enhancer: CameraEnhancer, reader: BarcodeReader) => void;
    onScanned?: (results: TextResult[]) => void;
    onPlayed?: (playCallbackInfo: PlayCallbackInfo) => void;
    onClosed?: () => void;
}

const BarcodeScanner: React.FC<ScannerProps> = (props) => {
    // const videoRef = useRef<HTMLVideoElement | null>(null);
    const container = useRef<HTMLDivElement | null>(null);
    const reader = useRef<BarcodeReader | null>(null);
    const enhancer = useRef<CameraEnhancer | null>(null);
    const mounted = useRef(false);
    const interval = useRef<any>(null);
    const decoding = useRef(false);

    useEffect(() => {
        const init = async () => {
            if (!BarcodeReader.isWasmLoaded()) {
                BarcodeReader.license = props.license || "DLS2eyJoYW5kc2hha2VDb2RlIjoiMjAwMDAxLTE2NDk4Mjk3OTI2MzUiLCJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSIsInNlc3Npb25QYXNzd29yZCI6IndTcGR6Vm05WDJrcEQ5YUoifQ=="; // one-day trial license
                BarcodeReader.engineResourcePath = "https://cdn.jsdelivr.net/npm/dynamsoft-javascript-barcode@9.6.11/dist/";
            }

            reader.current = await BarcodeReader.createInstance();
            enhancer.current = await CameraEnhancer.createInstance();

            if (container.current) {
                await enhancer.current.setUIElement(container.current);
            }

            enhancer.current.on("played", (playCallbackInfo: PlayCallbackInfo) => {
                props.onPlayed?.(playCallbackInfo);
                startScanning();
            });

            enhancer.current.on("cameraClose", () => {
                props.onClosed?.();
            });

            enhancer.current.setVideoFit("cover");
            props.onInitialized?.(enhancer.current, reader.current);
        };

        if (!mounted.current) {
            init();
            mounted.current = true;
        }

        return () => {
            stopScanning();
            enhancer.current?.close();
            mounted.current = false;
        };
    }, []);

    const toggleCamera = () => {
        if (mounted.current) {
            if (props.isActive) {
                enhancer.current?.open(true);
            } else {
                stopScanning();
                enhancer.current?.close();
            }
        }
    };

    useEffect(() => {
        toggleCamera();
    }, [props.isActive]);

    const startScanning = () => {
        const decode = async () => {
            if (!decoding.current && reader.current && enhancer.current) {
                decoding.current = true;
                const results = await reader.current.decode(enhancer.current.getFrame());
                props.onScanned?.(results);
                decoding.current = false;
            }
        };

        interval.current = setInterval(decode, props.interval || 40);
    };

    const stopScanning = () => {
        clearInterval(interval.current);
    };

    return (
        <div ref={container} style={{ position: "relative", width: "100%", height: "100%" }}>
            <div className="dce-video-container"></div>
        </div>
    );
};

export default BarcodeScanner;
