// "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=0&longitude=0"
import "react-datepicker/dist/react-datepicker.css";
import { useEffect, useState } from "react";

import styles from "./Form.module.css";
import Button from "./Button";
import Message from "./Message";
import BackButton from "./BackButton";
import Spinner from "./Spinner";
import DatePicker from "react-datepicker";
import { useUrlPosition } from "../Hooks/useUrlPosition";
import { useCities } from "../contexts/CitiesContext";
import { useNavigate } from "react-router-dom";

function convertToEmoji(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}
const BASE_URL = "https://api.bigdatacloud.net/data/reverse-geocode-client";

function Form() {
  const [cityName, setCityName] = useState("");
  const navigate = useNavigate();
  const { _createCity, isLoading } = useCities();
  const [country, setCountry] = useState("");
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [lat, lng] = useUrlPosition();
  const [isLoadingGeocoding, setIsLoadingGeocoding] = useState(false);
  const [geoCodingError, setGeoCodingError] = useState("");
  const [emoji, setEmoji] = useState("");

  useEffect(() => {
    if (!lat || !lng) return;
    (async function fetchCityData() {
      try {
        setIsLoadingGeocoding(true);
        setGeoCodingError("");
        const res = await fetch(`${BASE_URL}?latitude=${lat}&longitude=${lng}`);
        const data = await res.json();

        if (!data.countryCode)
          throw new Error("No country found. Click somewhere else 😊");
        setCityName(data.city || data.locality || "");
        setCountry(data.countryName || "");
        setEmoji(convertToEmoji(data.countryCode));
      } catch (err) {
        setGeoCodingError(err.message);
      } finally {
        setIsLoadingGeocoding(false);
      }
    })();
  }, [lat, lng]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!cityName || !date) return;

    const newCity = {
      cityName,
      country,
      emoji,
      date,
      notes,
      position: { lat, lng },
    };
    await _createCity(newCity);
    navigate("/app/cities");
  }

  if (isLoadingGeocoding) return <Spinner />;
  if (!lat && !lng)
    return <Message message={"Start by clicking somewhere on the map"} />;
  if (geoCodingError) return <Message message={geoCodingError} />;

  return (
    <form
      className={`${styles.form} ${isLoading ? styles.loading : ""}`}
      onSubmit={handleSubmit}
    >
      <div className={styles.row}>
        <label htmlFor="cityName">City name</label>
        <input
          id="cityName"
          onChange={(e) => setCityName(e.target.value)}
          value={cityName}
        />
        <span className={styles.flag}>{emoji}</span>
      </div>

      <div className={styles.row}>
        <label htmlFor="date">When did you go to {cityName}?</label>

        <DatePicker
          id="date"
          onChange={(date) => setDate(date)}
          selected={date}
          dateFormat={"dd/MM/yyyy"}
        />
      </div>

      <div className={styles.row}>
        <label htmlFor="notes">Notes about your trip to {cityName}</label>
        <textarea
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          value={notes}
        />
      </div>

      <div className={styles.buttons}>
        <Button type="primary">Add</Button>
        <BackButton />
      </div>
    </form>
  );
}

export default Form;
