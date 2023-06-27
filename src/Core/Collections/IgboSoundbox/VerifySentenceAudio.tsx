import React, { useEffect, useState, ReactElement } from 'react';
import { cloneDeep, noop } from 'lodash';
import { Box, Button, Heading, Link, Text, Tooltip, useToast } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import ResourceNavigationController from 'src/Core/Collections/components/ResourceNavigationController';
import {
  getRandomExampleSuggestionsToReview,
  putReviewForRandomExampleSuggestions,
} from 'src/shared/DataCollectionAPI';
import Spinner from 'src/shared/primitives/Spinner';
import { ExampleSuggestion } from 'src/backend/controllers/utils/interfaces';
import ReviewActions from 'src/backend/shared/constants/ReviewActions';
import CrowdsourcingType from 'src/backend/shared/constants/CrowdsourcingType';
import { RECORDING_AUDIO_STANDARDS_DOC } from 'src/Core/constants';
import SandboxAudioReviewer from './SandboxAudioReviewer';
import Completed from '../components/Completed';
import EmptyExamples from './EmptyExamples';
import { SentenceVerification } from './types/SentenceVerification';

const DEFAULT_CURRENT_EXAMPLE = { igbo: '', pronunciations: [] };

const VerifySentenceAudio = ({
  setIsDirty,
  goHome,
}: {
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  goHome: () => void;
}): ReactElement => {
  const [examples, setExamples] = useState<ExampleSuggestion[] | null>(null);
  const [reviews, setReviews] = useState<SentenceVerification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(-1);
  const isCompleteDisabled = reviews.some((review) => !review) || isUploading;
  const toast = useToast();
  const currentExample = Array.isArray(examples)
    ? examples[exampleIndex] || DEFAULT_CURRENT_EXAMPLE
    : DEFAULT_CURRENT_EXAMPLE;

  const updateReviews = (pronunciationId: string, action: ReviewActions) => {
    const clonedReviews = cloneDeep(reviews);
    const currentExampleReviews = clonedReviews[exampleIndex].reviews;
    currentExampleReviews[pronunciationId] = action;
    clonedReviews[exampleIndex].reviews = currentExampleReviews;
    setReviews(clonedReviews);
  };

  const handleNext = () => {
    if (exampleIndex !== examples.length - 1) {
      setExampleIndex(exampleIndex + 1);
    }
  };

  const handleBack = () => {
    if (exampleIndex !== 0) {
      setExampleIndex(exampleIndex - 1);
    }
  };

  const handleOnDeny = (pronunciationId: string) => {
    updateReviews(pronunciationId, ReviewActions.DENY);
    setIsDirty(true);
  };

  const handleOnApprove = (pronunciationId: string) => {
    updateReviews(pronunciationId, ReviewActions.APPROVE);
    setIsDirty(true);
  };

  const handleUploadReviews = async () => {
    try {
      const payload: SentenceVerification[] = reviews;
      setIsLoading(true);
      await putReviewForRandomExampleSuggestions(payload);
    } catch (err) {
      toast({
        title: 'An error occurred',
        description: 'Unable to upload example sentence reviews.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsUploading(true);
      await handleUploadReviews();
      setIsComplete(true);
    } catch (err) {
      toast({
        title: 'An error occurred',
        description: 'Unable to complete verifying example sentences.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!isComplete) {
      setIsLoading(true);
      (async () => {
        try {
          const { data: randomExamples } = await getRandomExampleSuggestionsToReview();
          setExamples(randomExamples);
          setExampleIndex(0);

          const defaultReviews: SentenceVerification[] = randomExamples.map(({ id, pronunciations = [] }) => ({
            id: id.toString(),
            reviews: pronunciations.reduce(
              (reviews, { _id }) => ({
                ...reviews,
                [_id.toString()]: ReviewActions.SKIP,
              }),
              {},
            ),
          }));
          setReviews(defaultReviews);
        } catch (err) {
          toast({
            title: 'An error occurred',
            description: 'Unable to retrieve example sentences.',
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [isComplete]);

  const shouldRenderExamples =
    !isLoading && Array.isArray(examples) && examples?.length && examples?.length === reviews?.length && !isComplete;
  const noExamples = !isLoading && !examples?.length && !isComplete;

  return shouldRenderExamples ? (
    <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" className="space-y-4 p-6">
      <Heading as="h1" textAlign="center" fontSize="2xl" color="gray.600">
        Listen to know if this sentence matches the audio
      </Heading>
      <Text fontFamily="Silka">
        Each audio should follow our{' '}
        <Link textDecoration="underline" href={RECORDING_AUDIO_STANDARDS_DOC} target="_blank">
          Recording Audio Standards
          <ExternalLinkIcon boxSize="3" ml={1} />
        </Link>{' '}
        document.
      </Text>
      <Box
        backgroundColor="gray.100"
        borderRadius="md"
        borderColor="gray.300"
        borderWidth="1px"
        minHeight={32}
        width={['full', 'lg']}
        m="12"
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        p="6"
        className="space-y-6"
      >
        <Text fontSize="xl" textAlign="center" fontFamily="Silka" color="gray.700">
          {currentExample.igbo}
        </Text>
        <SandboxAudioReviewer
          pronunciations={currentExample.pronunciations}
          onApprove={handleOnApprove}
          onDeny={handleOnDeny}
          review={reviews[exampleIndex]}
        />
      </Box>
      <Box className="w-full flex flex-row justify-center items-center space-x-4">
        <ResourceNavigationController
          index={exampleIndex}
          resources={reviews}
          onBack={handleBack}
          onNext={handleNext}
          onSkip={noop}
        />
      </Box>
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" className="space-y-3">
        <Box
          data-test="editor-recording-options"
          display="flex"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          className="space-x-3"
        >
          <Tooltip label="Review all sentences before completing.">
            <Box>
              <Button
                colorScheme="green"
                onClick={!isCompleteDisabled ? handleComplete : noop}
                rightIcon={(() => (
                  <>💾</>
                ))()}
                aria-label="Complete recordings"
                isDisabled={isCompleteDisabled}
                borderRadius="full"
                fontFamily="Silka"
                fontWeight="bold"
                p={6}
              >
                Submit Batch
              </Button>
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  ) : noExamples ? (
    <EmptyExamples setIsDirty={setIsDirty} goHome={goHome} />
  ) : isComplete ? (
    <Completed
      type={CrowdsourcingType.VERIFY_EXAMPLE_AUDIO}
      setIsComplete={setIsComplete}
      setIsDirty={setIsDirty}
      goHome={goHome}
    />
  ) : (
    <Spinner />
  );
};

export default VerifySentenceAudio;
