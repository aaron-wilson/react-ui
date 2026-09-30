import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderChoice } from "../src/components/ProviderChoice";
import { WanderPicture } from "../src/components/WanderPicture";

describe("local docs and artwork", () => {
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
