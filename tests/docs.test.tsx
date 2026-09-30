import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderChoice } from "../src/components/ProviderChoice";
import { WanderPicture } from "../src/components/WanderPicture";

describe("local docs and artwork", () => {
  it("keeps the selected content and source hashes in the snapshot", async () => {
    const snapshot = JSON.parse(await readFile(resolve("content/snapshot.json"), "utf8"));
    expect(snapshot.documents.map((item: { name: string }) => item.name)).toEqual([
      "planning-journey",
      "planning-providers",
    ]);
    expect(snapshot.sourceRevision).toMatch(/^[a-f0-9]{40}$/);
  });

  it("labels the image and gives both responsive formats sizes", () => {
    const { container } = render(<WanderPicture />);
    expect(screen.getByRole("img", { name: /mountain landscape/i })).toHaveAttribute(
      "width",
      "1280"
    );
    expect(container.querySelectorAll("source[sizes][srcset]")).toHaveLength(2);
  });

  it("shows a local provider setting without making a request", () => {
    render(<ProviderChoice />);
    expect(screen.getByText("PROVIDER_WEATHER=mock")).toBeInTheDocument();
  });
});
