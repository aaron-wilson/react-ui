export function WanderPicture() {
  return (
    <picture>
      <source
        type="image/avif"
        srcSet="/images/wander-city-640.avif 640w, /images/wander-city-1280.avif 1280w"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <source
        type="image/webp"
        srcSet="/images/wander-city-640.webp 640w, /images/wander-city-1280.webp 1280w"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
      <img
        src="/images/wander-city-1280.webp"
        width="1280"
        height="800"
        alt="Illustrated mountain landscape at sunset with a winding path"
        className="surface h-auto w-full rounded-3xl"
      />
    </picture>
  );
}
