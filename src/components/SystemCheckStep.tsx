import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, CheckCircle2, AlertCircle, ArrowLeft, Camera } from "lucide-react";
import { motion } from "framer-motion";

interface SystemCheckStepProps {
  onStart: () => void;
  onClose: () => void;
  onBack: () => void;
}

export const SystemCheckStep = ({ onStart, onClose, onBack }: SystemCheckStepProps) => {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Guard clause: Exit early if video element doesn't exist yet
    if (!videoRef.current) {
      return;
    }

    let mounted = true;
    
    // Request camera access
    const setupCamera = async () => {
      try {
        console.log("🎥 Requesting camera access...");
        
        // Check if mediaDevices API is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("MediaDevices API not supported in this browser");
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        console.log("✅ Camera access granted:", stream.getVideoTracks());
        
        if (!mounted) {
          console.log("⚠️ Component unmounted, stopping stream");
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        streamRef.current = stream;
        
        // Attach stream to video element (now guaranteed to exist)
        if (videoRef.current) {
          console.log("📺 Attaching stream to video element...");
          
          // Step 1: Attach the stream
          videoRef.current.srcObject = stream;
          
          // Add event listeners for debugging
          videoRef.current.onloadedmetadata = () => {
            console.log("✅ Video metadata loaded");
          };
          
          videoRef.current.oncanplay = () => {
            console.log("✅ Video can play");
          };
          
          videoRef.current.onplay = () => {
            console.log("✅ Video started playing");
          };
          
          // Step 2: Tell it to play (critical step!)
          try {
            await videoRef.current.play();
            console.log("✅ Camera preview started successfully");
            if (mounted) {
              setIsCameraReady(true);
            }
          } catch (playError) {
            console.error("❌ Error playing video:", playError);
            // Set ready anyway since stream is available
            if (mounted) {
              setIsCameraReady(true);
            }
          }
        }
        
      } catch (error: any) {
        console.error("❌ Camera access error:", error);
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        
        if (!mounted) return;
        
        // Handle different error types
        if (error.name === "NotFoundError") {
          setCameraError("No camera device found. You can continue without camera verification for testing purposes.");
        } else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (error.message.includes("not supported")) {
          setCameraError("Your browser doesn't support camera access. Please use Chrome, Firefox, or Edge.");
        } else {
          setCameraError(`Unable to access camera: ${error.message}. You can continue anyway for testing purposes.`);
        }
      }
    };

    setupCamera();
    
    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef]);

  const handleStartAudition = () => {
    // Stop the camera before starting the audition
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    // Only call onStart - DO NOT call onClose()
    // The modal will automatically disappear when auditionInProgress becomes true
    onStart();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">System & Camera Check</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          We need to verify your camera is working to ensure the integrity of the audition process.
        </p>
      </div>

      {/* Camera Status */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
            isCameraReady 
              ? "bg-green-100 dark:bg-green-900/30" 
              : "bg-yellow-100 dark:bg-yellow-900/30"
          }`}>
            {isCameraReady ? (
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            ) : (
              <Video className="h-6 w-6 text-yellow-600 dark:text-yellow-400 animate-pulse" />
            )}
          </div>
          <div>
            <p className="font-medium">Camera Status</p>
            <p className="text-sm text-muted-foreground">
              {isCameraReady ? "Camera is working" : "Requesting camera permission..."}
            </p>
          </div>
        </div>
        <Badge variant={isCameraReady ? "default" : "secondary"}>
          {isCameraReady ? "Ready" : "Waiting"}
        </Badge>
      </div>

      {/* Video Preview */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Camera Preview</p>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2 border-primary/20 bg-black">
          {cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <AlertCircle className="h-16 w-16 text-yellow-600 dark:text-yellow-400 mb-4" />
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-2">Camera Unavailable</p>
              <p className="text-xs text-muted-foreground max-w-md">{cameraError}</p>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  For production use, camera verification is required. In testing mode, you can proceed without it.
                </p>
              </div>
            </div>
          ) : !isCameraReady ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Video className="h-16 w-16 text-muted-foreground mb-4 animate-pulse" />
              <p className="text-sm text-muted-foreground">Initializing camera...</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                onError={(e) => {
                  console.error("❌ Video element error:", e);
                }}
                onLoadedData={() => {
                  console.log("✅ Video data loaded");
                }}
              />
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-white font-medium">Live</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        {isCameraReady && (
          <p className="text-xs text-muted-foreground">
            ✓ Your camera is working correctly. You can see yourself in the preview above.
          </p>
        )}
      </div>

      {/* Proctoring Notice */}
      {isCameraReady && (
        <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Proctoring Notice
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Your camera will be used to verify your identity during this audition. 
                This helps maintain the integrity and fairness of the assessment process.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="w-32"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          size="lg"
          className="flex-1 text-lg h-14 font-semibold"
          onClick={handleStartAudition}
          disabled={false}
        >
          {isCameraReady ? "Start Audition" : cameraError ? "Continue Anyway (Testing)" : "Waiting for Camera..."}
        </Button>
      </div>
      {!isCameraReady && !cameraError && (
        <p className="text-xs text-muted-foreground text-center">
          Please allow camera access in your browser to continue
        </p>
      )}
      {cameraError && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
          ⚠️ Camera verification skipped - This is for testing only. Production requires camera access.
        </p>
      )}
    </div>
  );
};
