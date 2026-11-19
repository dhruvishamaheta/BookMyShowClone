export function parseShowStartAt(dateValue, timeValue) {
  const dateText = String(dateValue || "").trim();
  const timeText = String(timeValue || "").trim();
  if (!dateText || !timeText) return null;

  let year;
  let month;
  let day;
  const isoDate = dateText.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dayFirstDate = dateText.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (isoDate) {
    year = Number(isoDate[1]);
    month = Number(isoDate[2]) - 1;
    day = Number(isoDate[3]);
  } else if (dayFirstDate) {
    day = Number(dayFirstDate[1]);
    month = Number(dayFirstDate[2]) - 1;
    year = Number(dayFirstDate[3]);
  } else {
    const parsedDate = new Date(dateText);
    if (Number.isNaN(parsedDate.getTime())) return null;
    year = parsedDate.getUTCFullYear();
    month = parsedDate.getUTCMonth();
    day = parsedDate.getUTCDate();
  }

  const twelveHourTime = timeText.match(/(?:^|\D)(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  let hours;
  let minutes;

  if (twelveHourTime) {
    hours = Number(twelveHourTime[1]);
    minutes = Number(twelveHourTime[2] || 0);
    const meridiem = twelveHourTime[3].toUpperCase();
    if (hours < 1 || hours > 12 || minutes > 59) return null;
    hours = (hours % 12) + (meridiem === "PM" ? 12 : 0);
  } else {
    const twentyFourHourTime = timeText.match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)(?:\D|$)/);
    if (!twentyFourHourTime) return null;
    hours = Number(twentyFourHourTime[1]);
    minutes = Number(twentyFourHourTime[2]);
  }

  const indiaOffsetMinutes = 5 * 60 + 30;
  const showStartAt = new Date(Date.UTC(year, month, day, hours, minutes) - indiaOffsetMinutes * 60 * 1000);
  if (
    Number.isNaN(showStartAt.getTime()) ||
    new Date(Date.UTC(year, month, day)).getUTCFullYear() !== year ||
    new Date(Date.UTC(year, month, day)).getUTCMonth() !== month ||
    new Date(Date.UTC(year, month, day)).getUTCDate() !== day
  ) {
    return null;
  }

  return showStartAt;
}

export function calculateCancellationAmounts(amount) {
  const paidAmount = Number(amount);
  if (!Number.isFinite(paidAmount) || paidAmount < 0) {
    throw new TypeError("Booking amount must be a non-negative number.");
  }

  const amountInPaise = Math.round(paidAmount * 100);
  const cancellationFeeInPaise = Math.round(amountInPaise * 0.2);
  const refundAmountInPaise = amountInPaise - cancellationFeeInPaise;

  return {
    paidAmount: amountInPaise / 100,
    cancellationFee: cancellationFeeInPaise / 100,
    refundAmount: refundAmountInPaise / 100,
  };
}
