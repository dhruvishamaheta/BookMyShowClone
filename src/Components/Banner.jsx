import { useEffect, useState } from "react";
import "./Banner.css";
import banner from "../assets/ramayana.png";
import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import banner4 from "../assets/banner4.png";

const banners = [
  { src: banner, alt: "Banner image default" },
  { src: banner1, alt: "Banner image 1" },
  { src: banner2, alt: "Banner image 2" },
  { src: banner3, alt: "Banner image 3" },
  { src: banner4, alt: "Banner image 4" },
];

function Banner() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const showPrevious = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
  };

  const showNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  return (
    <section className="banner">
      <img src={banners[activeIndex].src} alt={banners[activeIndex].alt} className="banner-img" />
      <div className="banner-overlay" />
      <div className="banner-text">
        <h1>Book tickets for movies, sports, plays, concerts and more</h1>
        <p>Discover new shows every week with our featured banner picks.</p>
        <div className="hero-buttons">
          <button className="hero-button primary">Book Now</button>
        </div>
      </div>
      <div className="banner-controls">
        <button className="banner-button banner-button-prev" onClick={showPrevious} aria-label="Previous banner">
          <span className="banner-icon">‹</span>
        </button>
        <button className="banner-button banner-button-next" onClick={showNext} aria-label="Next banner">
          <span className="banner-icon">›</span>
        </button>
      </div>
      <div className="banner-indicators">
        {banners.map((_, index) => (
          <button
            key={index}
            className={`banner-indicator ${index === activeIndex ? "active" : ""}`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show banner ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default Banner;
