import { Container } from "@/components/shared/Container";
import { Shimmer } from "@/components/shared/Shimmer";

/**
 * Failed page mirrors the confirmation layout (single icon + message +
 * CTAs) but in error tones.
 */
export default function FailedLoading() {
  return (
    <>
      <div className="h-20" />
      <section className="bg-cream py-16">
        <Container>
          <div className="mx-auto max-w-md space-y-6 text-center">
            <div className="flex justify-center">
              <Shimmer className="h-16 w-16" rounded="rounded-full" />
            </div>
            <Shimmer
              className="mx-auto h-6 w-48"
              rounded="rounded-md"
            />
            <Shimmer
              className="mx-auto h-3 w-72 max-w-full"
              rounded="rounded-md"
            />
            <Shimmer
              className="mx-auto h-12 w-full"
              rounded="rounded-xl"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
