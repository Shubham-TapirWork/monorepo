import { Container, Row, Col, Stack, Image, Nav, NavLink } from "react-bootstrap";

function Footer() {
    return (
        <footer className="mt-5">
            <Container fluid>
                <Row className="text-white p-4" style={{ backgroundColor: '#001f3f' }}>
                    <Col className="ms-5">
                        <Stack>
                            <Image
                                src="./images/image.png"
                                alt="company logo"
                                rounded
                                width={150}
                                height={150}
                            />
                            <h2>Company Name</h2>
                            <p>Company tagline here</p>
                        </Stack>
                    </Col>
                    <Col>
                        <Nav className="flex-column fs-5">
                            <h4>Useful Links</h4>
                            <NavLink href="#" className="text-white">Home</NavLink>
                            <NavLink href="#" className="text-white">About</NavLink>
                            <NavLink href="#" className="text-white">Products</NavLink>
                            <NavLink href="#" className="text-white">We’re hiring!</NavLink>
                        </Nav>
                    </Col>
                    <Col>
                        <h4>Contact us!</h4>
                        <p>email@fakeemail.com</p>
                        <p>Phone: +1(800) 867-5399</p>
                    </Col>
                </Row>
            </Container>
        </footer>
    );
}

export default Footer;
