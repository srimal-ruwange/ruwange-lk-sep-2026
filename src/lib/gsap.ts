import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP);
gsap.defaults({ ease: "power3.out", duration: 1 });

export { gsap, ScrollTrigger, SplitText, DrawSVGPlugin, useGSAP };
