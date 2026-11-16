import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import BuildDeploy from "./components/BuildDeploy";
import FAQ from "./components/FAQ";
import Footer from "./components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <BuildDeploy />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
