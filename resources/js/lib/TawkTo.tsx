import { useEffect } from "react";

export default function TawkTo() {
    useEffect(() => {
        const script = document.createElement("script");

        script.src = "https://embed.tawk.to/6ac83066cf4ec034c78fbccd/1k4evq4a1";

        script.async = true;
        script.charset = "UTF-8";
        script.setAttribute("crossorigin", "*");

        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    return null;
}
