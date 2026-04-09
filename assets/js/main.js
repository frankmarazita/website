// Restore the obfuscated email link (defeats HTML-only harvesters)
// https://spencermortensen.com/articles/email-obfuscation
document.addEventListener("DOMContentLoaded", function () {
  const emailLink = document.getElementById("email-link");
  if (emailLink) {
    emailLink.setAttribute(
      "href",
      emailLink
        .getAttribute("href")
        .replace("to", "mailto:m")
        .replace("-frank/", "e@fmz."),
    );
    emailLink.removeAttribute("rel");
  }
});

// Convert UTC timestamps to local time for blognotes
document.addEventListener("DOMContentLoaded", function () {
  const dateElements = document.querySelectorAll(".line-date[data-utc]");

  dateElements.forEach(function (element) {
    const utcTimestamp = element.getAttribute("data-utc");

    if (utcTimestamp) {
      try {
        const utcDate = new Date(utcTimestamp);

        // Check if we have time information (not just date)
        const hasTime =
          utcTimestamp.includes("T") || utcTimestamp.includes(":");

        let localTimeString;
        if (hasTime) {
          // Format with both date and time - custom format without comma
          const dateStr = utcDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const timeStr = utcDate.toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
          localTimeString = `${dateStr} ${timeStr}`;
        } else {
          // Format with just date
          localTimeString = utcDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }

        element.textContent = localTimeString;
      } catch (error) {
        console.error("Error parsing date:", utcTimestamp, error);
        // Keep the original server-rendered time on error
      }
    }
  });
});
