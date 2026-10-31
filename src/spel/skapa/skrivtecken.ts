// Vad barnet kan skriva i Pennans bok: bokstäver med å, ä och ö, siffror ("en katt med 2 hattar") och mellanslag.
// Samma regel gäller datorns tangentbord, skärmtangenterna, det dolda inmatningsfältet och provgränssnittet.
// Spärrlistan och tolken avgör sedan vad orden betyder; här tas bara tecken bort som inget ord kan innehålla.

const EJ_SKRIVBART = /[^a-zA-ZåäöÅÄÖ0-9 ]/g;
const SKRIVTANGENT = /^[a-zA-ZåäöÅÄÖ0-9]$/;

/** Texten med bara skrivbara tecken, högst 80 tecken. */
export function skrivbarText(s: string): string {
  return s.replace(EJ_SKRIVBART, "").slice(0, 80);
}

/** Ett enskilt tangenttryck som skriver ett tecken (mellanslag hanteras för sig). */
export function arSkrivtangent(tangent: string): boolean {
  return SKRIVTANGENT.test(tangent);
}
