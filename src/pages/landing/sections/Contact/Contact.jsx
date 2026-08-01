import { useState } from "react";
import { Button, Input, Textarea } from "../../../../components/ui";
import { MailIcon, MapPinIcon, PhoneIcon } from "../../../../components/ui/icons";
import { useToast } from "../../../../context/ToastContext";
import Reveal from "../../components/Reveal/Reveal";
import SectionHeading from "../../components/SectionHeading/SectionHeading";
import "./Contact.css";

/* Coordonnées provisoires — à remplacer par les informations officielles de l'UCDS */
const CONTACT_INFO = [
  { icon: PhoneIcon, label: "Téléphone", value: "+221 00 000 00 00" },
  { icon: MailIcon, label: "Email", value: "contact@ucds-medinasabakh.sn" },
  { icon: MapPinIcon, label: "Adresse", value: "Commune de Médina Sabakh, Sénégal" },
];

export default function Contact() {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setSubmitting(false);
    event.target.reset();
    toast.success("Votre message a bien été envoyé. Nous vous répondrons rapidement.");
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <SectionHeading eyebrow="Contact" title="Nous contacter" />

        <div className="contact__grid">
          <Reveal className="contact__info">
            <ul className="contact__list">
              {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                <li key={label}>
                  <span className="contact__icon">
                    <Icon />
                  </span>
                  <span>
                    <strong>{label}</strong>
                    <br />
                    {value}
                  </span>
                </li>
              ))}
            </ul>
            <div className="contact__map">
              <iframe
                title="Localisation de Médina Sabakh"
                src="https://www.google.com/maps?q=M%C3%A9dina%20Sabakh%2C%20S%C3%A9n%C3%A9gal&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>

          <Reveal delay={100} className="contact__form-wrap">
            <form className="contact__form" onSubmit={handleSubmit}>
              <Input label="Nom complet" name="name" placeholder="Votre nom" required />
              <Input label="Email" name="email" type="email" placeholder="vous@exemple.sn" required />
              <Input label="Sujet" name="subject" placeholder="Objet de votre message" required />
              <Textarea label="Message" name="message" placeholder="Votre message..." required rows={5} />
              <Button type="submit" fullWidth loading={submitting}>
                Envoyer le message
              </Button>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
