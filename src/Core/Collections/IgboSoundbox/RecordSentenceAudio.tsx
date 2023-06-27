import React, { useEffect, useState, ReactElement } from 'react';
import { noop } from 'lodash';
import { Box, Heading, Text, Tooltip, useToast } from '@chakra-ui/react';
import { ExampleSuggestion } from 'src/backend/controllers/utils/interfaces';
import { getRandomExampleSuggestions, putAudioForRandomExampleSuggestions } from 'src/shared/DataCollectionAPI';
import { Card, PrimaryButton, Spinner } from 'src/shared/primitives';
import CrowdsourcingType from 'src/backend/shared/constants/CrowdsourcingType';
import RecorderBase from 'src/shared/components/views/components/AudioRecorder/RecorderBase';
import ResourceNavigationController from 'src/Core/Collections/components/ResourceNavigationController';
import Completed from '../components/Completed';
import EmptyExamples from './EmptyExamples';

const RecordSentenceAudio = ({
  setIsDirty,
  goHome,
}: {
  setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
  goHome: () => void;
}): ReactElement => {
  const [examples, setExamples] = useState<ExampleSuggestion[] | null>(null);
  const [pronunciations, setPronunciations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(-1);
  const [visitedLastExampleIndex, setVisitedLastExampleIndex] = useState(false);
  const isCompleteEnabled =
    !isUploading && pronunciations.some((pronunciation) => pronunciation) && visitedLastExampleIndex;
  const toast = useToast();

  const handlePronunciation = (audioData) => {
    const updatedPronunciations = [...pronunciations];
    updatedPronunciations[exampleIndex] = audioData;
    setPronunciations(updatedPronunciations);
    setIsDirty(true);
  };

  const handleNext = () => {
    if (exampleIndex !== examples.length - 1) {
      setExampleIndex(exampleIndex + 1);
    }
    if (exampleIndex + 1 === examples.length - 1) {
      setVisitedLastExampleIndex(true);
    }
  };

  const handleBack = () => {
    if (exampleIndex !== 0) {
      setExampleIndex(exampleIndex - 1);
    }
  };

  const handleSkip = () => {
    const updatedPronunciations = [...pronunciations];
    updatedPronunciations[exampleIndex] = '';
    setPronunciations(updatedPronunciations);
    setIsDirty(true);
    handleNext();
  };

  const handleUploadAudio = async () => {
    try {
      const payload = examples.map((example, exampleIndex) => ({
        id: example.id.toString(),
        pronunciation: pronunciations[exampleIndex],
      }));
      setIsLoading(true);
      await putAudioForRandomExampleSuggestions(payload);
    } catch (err) {
      toast({
        title: 'An error occurred',
        description: 'Unable to upload example sentence recordings.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      console.log('Unable to submit audio', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsUploading(true);
      await handleUploadAudio();
      setIsComplete(true);
    } catch (err) {
      toast({
        title: 'An error occurred',
        description: 'Unable to complete recording example sentences.',
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
        const { data: randomExamples } = await getRandomExampleSuggestions();
        setExamples(randomExamples);
        setExampleIndex(0);
        setPronunciations(new Array(randomExamples.length).fill(''));
        setIsLoading(false);
      })();
    }
  }, [isComplete]);
  const shouldRenderExamples = !isLoading && exampleIndex !== -1 && examples?.length && !isComplete;
  const noExamples = !isLoading && !examples?.length && !isComplete;

  return shouldRenderExamples ? (
    <Box className="flex flex-col justify-between items-center p-6 h-full">
      <Box className="flex flex-col justify-center items-center space-y-4">
        <Heading as="h1" textAlign="center" fontSize="2xl" color="gray.600">
          Record sentence audio
        </Heading>
        <Text fontFamily="Silka">Play audio and then record audio for each sentence</Text>
        <Card>
          <Text fontSize="xl" textAlign="center" fontFamily="Silka" color="gray.700">
            {examples[exampleIndex].igbo}
          </Text>
        </Card>
      </Box>
      <Box data-test="editor-recording-options" className="flex flex-col justify-center items-center space-y-4 w-full">
        <Tooltip label={!isCompleteEnabled ? 'Please record at least one audio to complete this section' : ''}>
          <Box>
            <PrimaryButton
              onClick={isCompleteEnabled ? handleComplete : noop}
              rightIcon={(() => (
                <>💾</>
              ))()}
              aria-label="Complete recordings"
              isDisabled={!isCompleteEnabled}
            >
              Submit Batch
            </PrimaryButton>
          </Box>
        </Tooltip>
        <RecorderBase
          path="pronunciation"
          hideTitle
          onStopRecording={handlePronunciation}
          onResetRecording={noop}
          audioValue={pronunciations[exampleIndex]}
          toastEnabled={false}
        />
        <ResourceNavigationController
          index={exampleIndex}
          resources={examples}
          onBack={handleBack}
          onNext={handleNext}
          onSkip={handleSkip}
        />
      </Box>
    </Box>
  ) : noExamples ? (
    <EmptyExamples recording goHome={goHome} setIsDirty={setIsDirty} />
  ) : isComplete ? (
    <Completed
      type={CrowdsourcingType.RECORD_EXAMPLE_AUDIO}
      setIsComplete={setIsComplete}
      setIsDirty={setIsDirty}
      goHome={goHome}
    />
  ) : (
    <Spinner />
  );
};

export default RecordSentenceAudio;
