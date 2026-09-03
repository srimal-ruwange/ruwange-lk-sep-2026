import Hero from "@/components/Hero";
import About from "@/components/About";
import Paradise from "@/components/Paradise";
import Work from "@/components/Work";
import Capabilities from "@/components/Capabilities";
import Remote from "@/components/Remote";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main id="top">
      <Hero />
      <About />
      <Paradise />
      <Work />
      <Capabilities />
      <Remote />
      <Contact />
      <Footer />
    </main>
  );
}
