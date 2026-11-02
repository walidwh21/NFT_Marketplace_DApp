import React from "react";
import Image from "next/image";

//INTERNAL IMPORT
import Style from "../styles/aboutus.module.css";
import { Brand } from "../components/componentsindex";
import images from "../assets/img";

const aboutus = () => {
  const teamArray = [
    { name: "Team Member One", position: "Founder & Product Lead", images: images.team1 },
    { name: "Team Member Two", position: "Smart Contract Engineer", images: images.team2 },
    { name: "Team Member Three", position: "Frontend Engineer", images: images.team3 },
    { name: "Team Member Four", position: "Community & Operations", images: images.team4 },
  ];

  const factsArray = [
    { title: "10k+", info: "Digital items listed (placeholder figure)" },
    { title: "2,500+", info: "Registered wallets (placeholder figure)" },
    { title: "40+", info: "Countries reached (placeholder figure)" },
  ];

  return (
    <div className={Style.aboutus}>
      <div className={Style.aboutus_box}>
        <div className={Style.aboutus_box_hero}>
          <div className={Style.aboutus_box_hero_left}>
            <h1>👋 About Us.</h1>
            <p>
              A marketplace where creators mint digital items and collectors buy, sell and resell them directly from their own wallets.
            </p>
          </div>
          <div className={Style.aboutus_box_hero_right}>
            <Image src={images.hero2} />
          </div>
        </div>

        <div className={Style.aboutus_box_title}>
          <h2>⛱ Our Team</h2>
          <p>
            A marketplace where creators mint digital items and collectors buy, sell and resell them directly from their own wallets.
          </p>
        </div>

        <div className={Style.aboutus_box_founder}>
          <div className={Style.aboutus_box_founder_box}>
            {teamArray.map((el, i) => (
              <div className={Style.aboutus_box_founder_box_img}>
                <Image
                  src={el.images}
                  alt={el.name}
                  width={500}
                  height={500}
                  className={Style.aboutus_box_founder_box_img_img}
                />
                <h3>{el.name}</h3>
                <p>{el.position}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={Style.aboutus_box_title}>
          <h2>🚀 At a Glance</h2>
          <p>
            A marketplace where creators mint digital items and collectors buy, sell and resell them directly from their own wallets.
          </p>
        </div>

        <div className={Style.aboutus_box_facts}>
          <div className={Style.aboutus_box_facts_box}>
            {factsArray.map((el, i) => (
              <div className={Style.aboutus_box_facts_box_info}>
                <h3>{el.title}</h3>
                <p>{el.info}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Brand />
    </div>
  );
};

export default aboutus;
