// Mäts bara i provets webbläsare. Räkna verkliga WebGL-anrop för hologrammets shader, utan att ändra scenen.
// Skillnaden mellan två hela vyer är missvisande: kameran visar olika bakgrund, och modeller laddas under tiden.
export async function matHologramRitanrop(page) {
  await page.addInitScript(() => {
    const hologram = new WeakSet();
    const aktiva = new WeakMap();
    const raknare = { nu: 0, senast: 0 };
    window.__holoRitanrop = raknare;
    const bildruta = () => {
      raknare.senast = raknare.nu;
      raknare.nu = 0;
      requestAnimationFrame(bildruta);
    };
    requestAnimationFrame(bildruta);
    for (const prototyp of [window.WebGLRenderingContext?.prototype, window.WebGL2RenderingContext?.prototype]) {
      if (!prototyp) continue;
      const lank = prototyp.linkProgram;
      prototyp.linkProgram = function (program) {
        const svar = lank.call(this, program);
        if ((this.getAttachedShaders(program) ?? []).some((s) => this.getShaderSource(s)?.includes("uniform float holoTid"))) hologram.add(program);
        return svar;
      };
      const anvand = prototyp.useProgram;
      prototyp.useProgram = function (program) {
        aktiva.set(this, !!program && hologram.has(program));
        return anvand.call(this, program);
      };
      for (const namn of ["drawArrays", "drawElements", "drawArraysInstanced", "drawElementsInstanced"]) {
        const rita = prototyp[namn];
        if (!rita) continue;
        prototyp[namn] = function (...args) {
          if (aktiva.get(this)) raknare.nu += 1;
          return rita.apply(this, args);
        };
      }
    }
  });
}
