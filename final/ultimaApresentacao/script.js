var sys_memoria = new Array(); //memoria usada pelas tabelas do sistema(contem as tabelas)
sys_tabelas = null; //lista de tabelas que estão na memória
sys_ciclos = 0; // quantos ciclos teve o sistemas como um todo
sys_total_page_fault = 0; //quantas page_faults os sistema teve como um todo
sys_ponteiro_fifo_r = null; //indica qual é o mais antigo arquivo da llista(indica o pronteiro da lista, ex [5])
sys_simul_proc_id = 0; //indica o id do processo da simulação que está sendo executado
page_fault_processo = new Array();

$(document).ready(function(){
    $("#json").on('change', function(){
            var formdata = new FormData($("#formulario")[0]);
        $.ajax({
                type: 'POST',
                url: 'teste.php?action=arqJson',
                enctype: 'multipart/form-data',
                data: formdata,
                async: false,
                contentType: false,
                processData: false,
                cache: false,
                success: function(data){
                    lerjson(data);
                    gravaJson();
                }
        });
    });
});

function lerjson(data){ //grava os dados gerais em variaveis globais
    var data = JSON.parse(data).data;
    entradas = data.entrada;
    simulacoes = data.simulacao;
    ciclos_pagina = data.ciclos_pagina;
    nro_proc = data.n_processos;
    reset_r = data.reset_r;
    tamanho_memoria = data.tamanho_memoria;
    for(var i=0; i< simulacoes.length; i++){
        simulacoes[i]['reset_r'] = reset_r;
        init_simulation(); //inicia simulação depois dos dados gravados
        sys_simul_proc_id += 1;
    }
}

function init_simulation(){
   var success = verificaMemoria();//retorna true se o processo está na memoria, false se não está
    if(!success){ //se nao estiver
        grava_page_fault();        
        if(sys_memoria.length >= tamanho_memoria){ //se a memória está cheia
            troca_processo();
        }else{ //se tiver espaço na memoria
            grava_memoria();
        }
        sys_ciclos += 1 + ciclos_pagina;
    }else{
        sys_ciclos += 1;
    }
}

function verificaMemoria(){
   var success = verifica_proc_memoria();
   return success;
}

function verifica_proc_memoria(){// verifica se o processo está na memória e retorna ture ou false
    var existe_memoria = false;
    sys_memoria.forEach(value => {
        if(value.pagina == simulacoes[sys_simul_proc_id].pagina && value.pid == simulacoes[sys_simul_proc_id].pid)
            existe_memoria = true;
    });
    return existe_memoria;
}

function troca_processo(){
    if(!sys_memoria[sys_ponteiro_fifo_r].r){//caso o processo mais antigo(FIFO R) não tenha sido referenciado
        processo = null;
        entradas.forEach( value =>{
            if(value.pid == simulacoes[sys_simul_proc_id].pid)
                value.tabela_paginas.forEach( vlr => {
                    if(vlr.page_number == simulacoes[sys_simul_proc_id].pagina)
                        processo = vlr;
                });
        });
        if(processo){
            sys_memoria[sys_ponteiro_fifo_r].pid = simulacoes[sys_simul_proc_id].pid;
            sys_memoria[sys_ponteiro_fifo_r].pagina = simulacoes[sys_simul_proc_id].pagina;
            sys_memoria[sys_ponteiro_fifo_r].r = processo.r;
            sys_memoria[sys_ponteiro_fifo_r].m = processo.m;
        }
        if(sys_ponteiro_fifo_r+1 == tamanho_memoria)//caso o ponteiro esteja apontando para o "ultimo" elemento
            sys_ponteiro_fifo_r = 0;
        else
            sys_ponteiro_fifo_r += 1;
    }else{ //caso esteja referenciado, então limpa e avança para o próximo
        if(sys_memoria[sys_ponteiro_fifo_r].reset_r == 0)
            sys_memoria[sys_ponteiro_fifo_r].r = false;
        else
            sys_memoria[sys_ponteiro_fifo_r].reset_r -= 1;
        if(sys_ponteiro_fifo_r+1 == tamanho_memoria)//caso o ponteiro esteja apontando para o "ultimo" elemento
            sys_ponteiro_fifo_r = 0;
        else
            sys_ponteiro_fifo_r += 1;
        troca_processo();
    }
}

function grava_memoria(){
    var fifo_estava_null = false;
    if(!sys_ponteiro_fifo_r && sys_ponteiro_fifo_r != 0){
        fifo_estava_null = true;
    }
    if((sys_ponteiro_fifo_r ? sys_ponteiro_fifo_r : 0 +1) == tamanho_memoria)//caso o ponteiro esteja apontando para o "ultimo" elemento
        sys_ponteiro_fifo_r = 0;
    else
        sys_ponteiro_fifo_r += 1;
    if(fifo_estava_null)
        sys_ponteiro_fifo_r = 0;
    sys_memoria[sys_ponteiro_fifo_r] = {
        'pid': simulacoes[sys_simul_proc_id].pid,
        'pagina': simulacoes[sys_simul_proc_id].pagina,
        'r': false,
        'reset_r': reset_r
    };
    if(simulacoes[sys_ponteiro_fifo_r]['modificou'])
        sys_memoria[sys_ponteiro_fifo_r]['r'] = true;
}

function grava_page_fault(){
    var page_fault_proc_exis = false;
    sys_total_page_fault += 1; //conta page_fault_geral
    if(page_fault_processo.length > 0){
        page_fault_processo.forEach(value => {
            if(value.pid == simulacoes[sys_simul_proc_id].pid){
                value.page_faults += 1;
                page_fault_proc_exis = true;
            }
        });
        if(!page_fault_proc_exis){
            page_fault_processo[page_fault_processo.length] = {
                'pid': simulacoes[sys_simul_proc_id].pid,
                'page_faults': 1,
            } 
        }
    }else{
        page_fault_processo[page_fault_processo.length] = {
            'pid': simulacoes[sys_simul_proc_id].pid,
            'page_faults': 1,
        } 
    }
}

function gravaJson(){
    var newJson = {
        'total_page_fault': sys_total_page_fault,
        'ciclos': sys_ciclos,
        'page_fault_processo': page_fault_processo
    }
    var send = JSON.stringify(newJson);
    $.ajax({
        type: 'POST',
        url: 'teste.php?action=gravaJson',
        dataType: 'json',
        data: {"json":send},
        async: false,
        cache: false,
        success: function(data){
            //alert('Json Gerado com Sucesso!');
        }
});
}