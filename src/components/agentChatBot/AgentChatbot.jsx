import React, { useState, useEffect } from "react";
import "./agentChatbot.css";
import SendIcon from "@mui/icons-material/Send";

import Chat from "../chat/Chat";

import OpenAI from "openai";
import { CircularProgress } from "@mui/material";

const AgentChatbot = () => {
  const [, setPageLoading] = useState(true);

  const [inputValue, setInputValue] = useState("");

  const API_KEY = process.env.REACT_APP_API_KEY;
  const ASSISTANT_ID = process.env.REACT_APP_ASSISTANT_ID;

  const [conversation, setConversation] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState("");

  const [fileInput, setFileInput] = useState(null);

  useEffect(() => {
    if (conversation.length !== 0) {
      sessionStorage.setItem("conversation", JSON.stringify(conversation));
    }
  }, [conversation]);

  // Initialize OpenAI
  const client = new OpenAI({
    apiKey: API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const handleSendMessage = async (value, role) => {
    setIsLoading(true);

    let fileId;
    if (fileInput) {
      console.log("fileInput ", fileInput);
      const fileData = new FormData();
      fileData.append("file", fileInput);

      console.log("fileInput ", fileInput);
      try {
        console.log("file uploading...");
        const file = await client.files.create({
          file: fileInput,
          purpose: "assistants",
        });

        fileId = file.id;
        setFileInput(null);
        console.log("Got File ID : ", fileId);
      } catch (error) {
        console.error("Error uploading file:", error);
        setIsLoading(false);
        return;
      }
    }

    // Send message with or without file attachment
    try {
      if (!threadId && fileId) {
        const thread = await client.beta.threads.create({
          messages: [
            {
              role: "user",
              content: value || "I have upladed the file",
              // Attach the new file to the message.
              attachments: [
                { file_id: fileId, tools: [{ type: "file_search" }] },
              ],
            },
          ],
        });
        setThreadId(thread.id);
        console.log("New thread created !!");
      } else if (fileId) {
        await client.beta.threads.messages.create(threadId, {
          role: "user",
          content: value || "I have upladed the file",
          attachments: [{ file_id: fileId, tools: [{ type: "file_search" }] }],
        });

        console.log("message with file");
        console.log("new msg in old thread");
      } else {
        await client.beta.threads.messages.create(threadId, {
          role: "user",
          content: value || "I have upladed the file",
        });
        console.log("message without file");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setConversation((prevConversation) => [
      ...prevConversation,
      {
        message: value,
        sender: role,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    // const run = await client.beta.threads.runs.create(threadId, {
    //   assistant_id: ASSISTANT_ID,
    // });

    // setRunId(run.id);
    console.log("run.id in sendMsg : ");
    setInputValue("");
    try {
      await checkStatusAndPrintMessages();
      setIsLoading(false);
    } catch (err) {
      console.log("Error in handle send MSg: ", err.message);
      setIsLoading(false);
    }
  };

  // const checkStatusAndPrintMessages = async (runId) => {
  //   console.log("Checking status and printing messages...");
  //   setIsLoading(true);
  //   try {
  //     console.log("Checking run status...");
  //     let runStatus = await client.beta.threads.runs.retrieve(threadId, runId);
  //     console.log(runStatus);

  //     switch (runStatus.status) {
  //       case "completed":
  //         console.log("Run completed successfully.");
  //         let messages = await client.beta.threads.messages.list(threadId);
  //         let lastMessage = messages.data[0].content[0].text.value;
  //         // Update conversation state with the new message
  //         setConversation((prevConversation) => [
  //           ...prevConversation,
  //           {
  //             message: lastMessage,
  //             sender: "bot",
  //             time: new Date().toLocaleTimeString([], {
  //               hour: "2-digit",
  //               minute: "2-digit",
  //             }),
  //           },
  //         ]);

  //         console.log("conversation run complete ", conversation);
  //         setIsLoading(false);
  //         break;

  //       case "in_progress":
  //         console.log("Run is in Progress. Waiting...");
  //         console.log("Run ID ; ", runId);
  //         setTimeout(() => checkStatusAndPrintMessages(runId), 500);
  //         break;

  //       case "queued":
  //         console.log("Run is Queued. Waiting...");
  //         setTimeout(() => checkStatusAndPrintMessages(runId), 500);
  //         break;

  //       case "failed":
  //         console.log("Sorry Run Failed :(");
  //         setIsLoading(false);
  //         break;

  //       default:
  //         console.log("some thing bad happed ");
  //     }
  //   } catch (error) {
  //     console.log("Error in checkStatusAndPrint : ", error.message);
  //     setIsLoading(false);
  //   }
  // };
  const checkStatusAndPrintMessages = async () => {
    const run = await client.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: ASSISTANT_ID,
    });

    const messages = await client.beta.threads.messages.list(threadId, {
      run_id: run.id,
    });

    const message = messages.data.pop();
    if (message.content[0].type === "text") {
      const { text } = message.content[0];
      const { annotations } = text;
      const citations = [];

      let index = 0;
      for (let annotation of annotations) {
        text.value = text.value.replace(annotation.text, "[" + index + "]");
        const { file_citation } = annotation;
        if (file_citation) {
          const citedFile = await client.files.retrieve(file_citation.file_id);
          citations.push("[" + index + "]" + citedFile.filename);
        }
        index++;
      }
      setConversation((prevConversation) => [
        ...prevConversation,
        {
          message: text.value,
          sender: "bot",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      console.log(text.value);
      console.log(citations.join("\n"));
    }
  };

  const initializeChat = async () => {
    try {
      const storedThreadId = sessionStorage.getItem("threadId");
      if (storedThreadId) {
        // If threadId exists in session storage, set the state to that value
        setThreadId(storedThreadId);
      } else {
        // If threadId doesn't exist in session storage, create a new thread
        const thread = await client.beta.threads.create();
        console.log("New thread created:", thread);
        // Set the state and save the thread ID in session storage
        setThreadId(thread.id);
        sessionStorage.setItem("threadId", thread.id);
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      setPageLoading(false);
    }
  };

  const getStoredConversation = () => {
    setPageLoading(true);
    return sessionStorage.getItem("conversation");
  };

  const handleFileInputChange = (event) => {
    setFileInput(event.target.files[0]);
  };

  useEffect(() => {
    // Retrieve conversation from session storage when component mounts
    const storedConversation = getStoredConversation();

    if (storedConversation) {
      setConversation(JSON.parse(storedConversation));
    }

    const getStarted = async () => {
      await initializeChat();
    };

    getStarted()
      .then(() => setPageLoading(false))
      .catch(() => setPageLoading(false));
  }, []);

  return (
    <>
      <div className="container chatbot">
        a
        <div className="chatbot_chat">
          <Chat conversation={conversation} />
        </div>
        <div className="prompt_input">
          <input
            type="text"
            placeholder="Type Here"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" &&
              !isLoading &&
              handleSendMessage(inputValue, "user")
            }
          />

          {!isLoading ? (
            <div className="operations d-flex align-items-center gap-3">
              <input
                type="file"
                accept=".pdf,.doc,.docx, .txt"
                onChange={handleFileInputChange}
              />
              <SendIcon
                className="send_btn"
                onClick={() => handleSendMessage(inputValue, "user")}
              />
            </div>
          ) : (
            <CircularProgress color="inherit" size={20} />
          )}
        </div>
      </div>
    </>
  );
};

export default AgentChatbot;
