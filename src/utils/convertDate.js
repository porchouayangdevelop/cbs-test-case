const formatTimeStamp = (time) => {
  const date = new Date(time);

  const fullDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const times = date.toLocaleDateString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return {
    fullDate,
    times,
    formattedDate: `${fullDate}, ${times}`,
    // formattedTime: `${times} ${fullDate}`,
    // formattedDateTime: `${times} ${fullDate}`,
    // isoDate: date.toISOString(),
    timestamp: date.getTime(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

export default formatTimeStamp;
