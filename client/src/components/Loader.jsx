import {motion} from 'framer-motion';

const Loader = ({text = 'Loading...'}) => {
    return(
        <motion.div className = "fixed inset-0 flex flex-col items-center justify-center bg-white z-50"
            initial = {{ opacity: 1}}
            exit={{opacity: 0}}
            transition = {{duration: 0.5}}
        >
            <div className="loader mb-4"/>
            <p className= "text-gray-600 text-sm" > {text} </p>
        </motion.div>
    );
};

export default Loader;