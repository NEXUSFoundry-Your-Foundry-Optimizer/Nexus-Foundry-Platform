import { jsx, jsxs } from "react/jsx-runtime";
import { motion } from "motion/react";
function Reveal({
  children,
  delay = 0,
  y = 24,
  className
}) {
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      className,
      initial: { opacity: 0, y },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true, margin: "-80px" },
      transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
      children
    }
  );
}
function RevealWords({ text, className }) {
  const words = text.split(" ");
  return /* @__PURE__ */ jsx("span", { className, children: words.map((w, i) => /* @__PURE__ */ jsxs(
    motion.span,
    {
      className: "inline-block",
      initial: { opacity: 0, y: "0.4em" },
      whileInView: { opacity: 1, y: 0 },
      viewport: { once: true },
      transition: { duration: 0.6, delay: i * 0.045, ease: [0.22, 1, 0.36, 1] },
      children: [
        w,
        i < words.length - 1 ? " " : ""
      ]
    },
    `${w}-${i}`
  )) });
}
export {
  RevealWords as R,
  Reveal as a
};
