/** Floating side tools matching live Renacon (Enquire / WhatsApp / Calculator). */
export function FloatingSideMenu() {
  return (
    <>
      <nav className="renacon-side-menu" aria-label="Quick contact">
        <a className="renacon-side-item enquire" href="/contact-us/" title="Enquire now">
          <span className="renacon-side-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5L4 8V6l8 5 8-5v2z" />
            </svg>
          </span>
          <span className="renacon-side-label">Enquire now</span>
        </a>
        <a
          className="renacon-side-item whatsapp"
          href="https://wa.link/r5dd4i"
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp"
        >
          <span className="renacon-side-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M17.47 14.38c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.18.27-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.23-1.37-.83-.74-1.38-1.65-1.54-1.93-.16-.28-.02-.43.12-.57.13-.12.28-.32.42-.48.14-.16.18-.27.28-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3s.98 2.66 1.12 2.85c.14.18 1.93 2.95 4.67 4.13.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.53-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
              <path d="M12.04 2C6.5 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.87L2 22l5.27-1.38A9.94 9.94 0 0 0 12.04 22C17.57 22 22 17.52 22 12S17.57 2 12.04 2zm0 18.1c-1.6 0-3.09-.44-4.36-1.2l-.31-.19-3.13.82.84-3.05-.2-.32A8.07 8.07 0 0 1 3.9 12c0-4.48 3.66-8.12 8.14-8.12 4.49 0 8.13 3.64 8.13 8.12 0 4.48-3.64 8.1-8.13 8.1z" />
            </svg>
          </span>
          <span className="renacon-side-label">WhatsApp</span>
        </a>
        <a className="renacon-side-item calculator" href="/calculator/" title="Calculator">
          <span className="renacon-side-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5.5 15h-3v-3h3v3zm0-4.5h-3V10h3v3.5zM9 18H6v-3h3v3zm0-4.5H6V10h3v3.5zM18 18h-3v-3h3v3zm0-4.5h-3V10h3v3.5zM18 9H6V5h12v4z" />
            </svg>
          </span>
          <span className="renacon-side-label">Calculator</span>
        </a>
      </nav>

      <a
        className="renacon-whatsapp-fab"
        href="https://wa.link/r5dd4i"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M17.47 14.38c-.28-.14-1.64-.81-1.9-.9-.25-.1-.44-.14-.62.14-.18.27-.71.9-.87 1.08-.16.18-.32.2-.6.07-.28-.14-1.17-.43-2.23-1.37-.83-.74-1.38-1.65-1.54-1.93-.16-.28-.02-.43.12-.57.13-.12.28-.32.42-.48.14-.16.18-.27.28-.45.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3s.98 2.66 1.12 2.85c.14.18 1.93 2.95 4.67 4.13.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.53-.08 1.64-.67 1.87-1.32.23-.65.23-1.2.16-1.32-.07-.11-.25-.18-.53-.32z" />
          <path d="M12.04 2C6.5 2 2 6.48 2 12c0 1.77.46 3.43 1.27 4.87L2 22l5.27-1.38A9.94 9.94 0 0 0 12.04 22C17.57 22 22 17.52 22 12S17.57 2 12.04 2zm0 18.1c-1.6 0-3.09-.44-4.36-1.2l-.31-.19-3.13.82.84-3.05-.2-.32A8.07 8.07 0 0 1 3.9 12c0-4.48 3.66-8.12 8.14-8.12 4.49 0 8.13 3.64 8.13 8.12 0 4.48-3.64 8.1-8.13 8.1z" />
        </svg>
      </a>
    </>
  );
}
