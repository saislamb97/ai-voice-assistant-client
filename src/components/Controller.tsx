import { useState } from "react";
import Title from "./Title";
import axios from "axios";
import RecordMessage from "./RecordMessage";

const Controller = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);

  function createBlobURL(data: any) {
    const blob = new Blob([data], { type: "audio/mpeg" });
    const url = window.URL.createObjectURL(blob);
    return url;
  }

  const handleStop = async (blobUrl: string) => {
    setIsLoading(true);
  
    // Append recorded message to messages
    const myMessage = { sender: "me", blobUrl };
    const messagesArr = [...messages, myMessage];
    setMessages(messagesArr);
  
    // Convert blob url to blob object
    fetch(blobUrl)
      .then((res) => res.blob())
      .then(async (blob) => {
        // Construct audio to send file
        const formData = new FormData();
        formData.append("file", blob, "myFile.wav");
  
        // Send form data to API endpoint
        try {
          const { data } = await axios.post(
            "http://localhost:8000/post-audio",
            formData,
            {
              headers: {
                "Content-Type": "audio/mpeg",
              },
              responseType: "arraybuffer",
            }
          );
  
          const responseBlob = new Blob([data], { type: "audio/mpeg" });
          const responseAudioSrc = createBlobURL(responseBlob);
  
          // Append to audio
          const bruceMessage = {
            sender: "bruce",
            blobUrl: responseAudioSrc,
            text: "Response text...",
          };
          messagesArr.push(bruceMessage);
          setMessages(messagesArr);
  
          // Play audio
          setIsLoading(false);
          const audio = new Audio(responseAudioSrc);
          audio.play();
  
          // Get text response
          try {
            const response = await axios.get("http://localhost:8000/get-response");
            const responseText = response.data.response;
            bruceMessage.text = responseText;
            setMessages([...messagesArr]);
          } catch (err) {
            console.error(err);
          }
        } catch (err) {
          console.error(err);
          setIsLoading(false);
        }
      });
  };

  return (
    <div className="h-screen overflow-y-hidden">
      {/* Title */}
      <Title setMessages={setMessages} />

      <div className="flex flex-col justify-between h-full overflow-y-scroll pb-96">
        {/* Conversation */}
        <div className="mt-5 px-5">
          {messages?.map((audio, index) => {
            return (
              <div
                key={index + audio.sender}
                className={
                  "flex flex-col " +
                  (audio.sender == "bruce" && "flex items-end")
                }
              >
                {/* Sender */}
                <div className="mt-4">
                  <p
                    className={
                      audio.sender == "bruce"
                        ? "text-right mr-2 italic text-green-500"
                        : "ml-2 italic text-blue-500"
                    }
                  >
                    {audio.sender}
                  </p>

                  {/* Message */}
                  <audio
                    src={audio.blobUrl}
                    className={audio.sender == "bruce" ? "float-right" : "float-left" }
                    controls
                  />

                  {/* Text response */}
                  <p
                    className={
                      audio.sender == "bruce"
                        ? "text-right mr-2 mt-1 text-gray-500 italic clear-right"
                        : "ml-2 mt-1 text-gray-500"
                    }
                  >
                    {audio.text}
                  </p>
                </div>
              </div>
            );
          })}

          {messages.length == 0 && !isLoading && (
            <div className="text-center font-light italic mt-10">
              Send Bruce a message...
            </div>
          )}

          {isLoading && (
            <div className="text-center font-light italic mt-10 animate-pulse">
              Gimme a few seconds...
            </div>
          )}
        </div>

        {/* Recorder */}
        <div className="fixed bottom-0 w-full py-6 border-t text-center bg-gradient-to-r from-sky-500 to-green-500">
          <div className="flex justify-center items-center w-full">
            <div>
              <RecordMessage handleStop={handleStop} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controller;
