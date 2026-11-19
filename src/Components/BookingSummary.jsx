function BookingSummary({ movie, theatre, time, seats }) {
  return (
    <div className="booking-summary">
      <h2>Booking Summary</h2>
      <p>Movie: {movie}</p>
      <p>Theatre: {theatre}</p>
      <p>Time: {time}</p>
      <p>Seats: {seats.join(", ")}</p>
      <p>Total Price: ₹{seats.length * 250}</p>
    </div>
  );
}
export default BookingSummary;
