import LandingFooter from "./components/LandingFooter/LandingFooter";
import LandingNavbar from "./components/LandingNavbar/LandingNavbar";
import About from "./sections/About/About";
import Contact from "./sections/Contact/Contact";
import HealthPosts from "./sections/HealthPosts/HealthPosts";
import Hero from "./sections/Hero/Hero";
import Missions from "./sections/Missions/Missions";
import News from "./sections/News/News";
import Partners from "./sections/Partners/Partners";
import Stats from "./sections/Stats/Stats";
import WhyUcds from "./sections/WhyUcds/WhyUcds";

export default function LandingPage() {
  return (
    <>
      <LandingNavbar />
      <main>
        <Hero />
        <About />
        <Missions />
        <WhyUcds />
        <Partners />
        <HealthPosts />
        <Stats />
        <News />
        <Contact />
      </main>
      <LandingFooter />
    </>
  );
}
