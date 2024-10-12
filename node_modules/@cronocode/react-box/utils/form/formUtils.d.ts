type FormValue = string | string[] | number | number[] | boolean;
interface FormObject {
    [index: string]: FormValue | FormObject;
}
declare namespace FormUtils {
    function getFormEntries(form: HTMLFormElement): FormObject;
}
export default FormUtils;
