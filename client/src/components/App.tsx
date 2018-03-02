import * as React from 'react';
import { Header } from './Header';
import { Docket } from './Docket';
import * as ReactModal from 'react-modal';
import { Footer } from './Footer';

ReactModal.setAppElement('#app');

export class App extends React.Component {
    render() {
        return (
            <div>
                <Header />
                <br />
                <Docket />
                <Footer />
            </div>
        );
    }
}