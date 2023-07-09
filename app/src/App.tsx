import "./App.css";
import { BskyAgent, RichText, AtUri } from "@atproto/api";
import { useAuthorization } from "./client/ATPProvider";
import LoginScreen from "./components/Login";
import Header from "./components/Header";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { Button, Card, Form, InputGroup, Stack } from "react-bootstrap";
import { useEffect, useState } from "react";
import axios from "axios";
import { SubmitHandler, useForm } from "react-hook-form";

interface Message {
  id: string;
  userDid: string;
  userHandle: string;
  message: string;
  indexedAt: string;
}

const backend = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || "http://localhost:3009/",
});

function Post(props: { agent: BskyAgent, data: Message, onDelete: (id: string) => void }) {
  const [message, setMessage] = useState('')
  const { userDid } = useAuthorization();

  if (!userDid) return (<></>)

  const onPost = async () => {
    const rt = new RichText({text: `@${props.data.userHandle} - ${props.data.message}`})
    await rt.detectFacets(props.agent)
    const postRecord = {
      $type: 'app.bsky.feed.post',
      text: rt.text,
      facets: rt.facets,
      createdAt: new Date().toISOString()
    }
    const { uri: uri, cid: cid } = await props.agent.post(postRecord)
    const objUri = new AtUri(uri)
    setMessage(`https://bsky.app/profile/${objUri.host}/post/${objUri.rkey}`)
  }

  return (
    <>
      
    { message.length > 0 ? (
      <>
      Mensagem postada no Bluesky: <a target="_blank" rel="noreferrer" href={message}>link</a>
      </>
    ) : ''}
    <Card>
      <Card.Body>
        <Card.Title>@{props.data.userHandle}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">
          {new Date(props.data.indexedAt).toLocaleString()}
        </Card.Subtitle>
        <Card.Text>{props.data.message}</Card.Text>
        <Card.Link href="#" onClick={() => onPost()}>
          Postar
        </Card.Link>
        <Card.Link href="#" onClick={() => props.onDelete(props.data.id)}>
          Deletar
        </Card.Link>
      </Card.Body>
    </Card>
    </>

  );
}

type PostFormType = {
  user: string;
  message: string;
};

function PostForm() {
  const { loginResponseData } = useAuthorization();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<PostFormType>();

  const [message, setMessage] = useState('');

  const onSubmit: SubmitHandler<PostFormType> = (data) => {
    backend
      .post(
        "/",
        {
          user: data.user,
          message: data.message,
        },
        {
          headers: {
            Authorization: `Bearer ${loginResponseData?.accessJwt}`,
          },
        }
      )
      .then((res) => {
        if (!!res.data.success) {
          setValue("user", "");
          setValue("message", "");
          setMessage("Correio enviado!")
        } else {
          setMessage(res.data.error);
        }
      });
  };

  return (
    <>
      <Row className="mt-3">
        <Col className="d-flex justify-content-center">
          <h3>Enviar correio anônimo</h3>
        </Col>
      </Row>
      <Row className="justify-content-center my-3">
        <Col xs md={9} lg={6}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <InputGroup className="mb-1">
              <InputGroup.Text id="basic-addon1">Para</InputGroup.Text>
              <InputGroup.Text id="basic-addon1">@</InputGroup.Text>
              <Form.Control
                {...register("user", { required: true })}
                placeholder="Username"
              />
            </InputGroup>
            {errors.user && "Insira um usuário"}
            <InputGroup className="mb-1">
              <InputGroup.Text>Texto</InputGroup.Text>
              <Form.Control
                {...register("message", { required: true, maxLength: 250 })}
                as="textarea"
                name="message"
              />
            </InputGroup>
            {message ? message : ""}
            {errors.message && (errors.message.type === 'required' ? "Insira uma mensagem" :
              errors.message.type === 'maxLength' ? 'Correio é longo demais' : '')}
            <div className="d-grid">
              <Button type="submit" variant="primary">
                Enviar
              </Button>
            </div>
          </form>
        </Col>
      </Row>
    </>
  );
}

function App() {
  const {
    agent,
    userHandle,
    userDid,
    loginResponseData,
    setLoginResponseData,
    loginResponseDataHasLoaded,
  } = useAuthorization();

  const [messageList, setMessageList] = useState<Message[]>([]);

  const getMessages = () => {
    backend
      .get("/", {
        headers: {
          Authorization: `Bearer ${loginResponseData?.accessJwt}`,
        },
      })
      .then((res) => {
        setMessageList(res.data);
        console.log(res.data);
      })
      .catch(() => {});
  };

  const deleteMessage = (id: string) => {
    try {
      backend
        .delete("/", {
          params: {
            id: id,
          },
          headers: {
            Authorization: `Bearer ${loginResponseData?.accessJwt}`,
          },
        })
        .then((res) => {
          console.log(res.data);
          getMessages();
        })
        .catch(() => {});
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    if (!userDid) return;
    getMessages();
  }, [userDid]);

  return (
    <>
      <Container fluid="sm">
        <Header
          logout={
            userHandle
              ? () => {
                  setLoginResponseData(null);
                }
              : null
          }
        />
        {!loginResponseDataHasLoaded ? (
          <div>Loading...</div>
        ) : loginResponseData ? (
          <>
            <PostForm />
            <Row className="justify-content-center my-3">
              <Col xs md={9} lg={6}>
                <Stack gap={2}>
                  {messageList.map((x) => (
                    <Post key={x.id} agent={agent} data={x} onDelete={deleteMessage} />
                  ))}
                </Stack>
              </Col>
            </Row>
          </>
        ) : (
          <>
            <LoginScreen agent={agent} />
          </>
        )}
      </Container>
    </>
  );
}

export default App;
